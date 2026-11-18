package com.nico.mailagent;

import java.io.*;
import java.net.Socket;
import java.util.*;
import java.util.regex.*;
import javax.net.ssl.SSLSocketFactory;

/** Minimal hand-written IMAP client. Literal-safe: byte-accurate reads, in \u0001 markers. */
public class Imap {
    public static class Msg {
        public String uid = "", from = "?", subject = "(no subject)", body = "", text = "";
    }

    private Socket s;
    private BufferedInputStream in;
    private OutputStream out;
    private int tagN = 0;
    private List<String> lastLines = new ArrayList<>();
    private List<byte[]> lastLits = new ArrayList<>();

    public void open(String host, int port, String user, String pass) throws Exception {
        s = SSLSocketFactory.getDefault().createSocket(host, port);
        in = new BufferedInputStream(s.getInputStream());
        out = s.getOutputStream();
        String greet = readLine().text;
        if (!greet.startsWith("*")) throw new IOException("not IMAP: " + greet);
        cmd("LOGIN \"" + q(user) + "\" \"" + q(pass) + "\"");
        cmd("SELECT INBOX");
    }

    static String q(String x) { return x == null ? "" : x.replace("\\", "\\\\").replace("\"", "\\\""); }

    static class Line { String text; List<byte[]> lits; }

    Line readLine() throws IOException {
        Line ln = new Line();
        ln.lits = new ArrayList<>();
        StringBuilder sb = new StringBuilder();
        while (true) {
            String raw = rawLine();
            Matcher m = Pattern.compile("\\{(\\d+)\\}\\s*$").matcher(raw);
            if (m.find()) {
                int n = Integer.parseInt(m.group(1));
                byte[] b = new byte[n];
                int off = 0;
                while (off < n) {
                    int k = in.read(b, off, n - off);
                    if (k < 0) throw new EOFException("literal truncated");
                    off += k;
                }
                ln.lits.add(b);
                sb.append(raw, 0, m.start()).append('\u0001').append(ln.lits.size() - 1).append('\u0001');
                continue;
            }
            sb.append(raw);
            break;
        }
        ln.text = sb.toString();
        return ln;
    }

    String rawLine() throws IOException {
        ByteArrayOutputStream bo = new ByteArrayOutputStream();
        int c;
        while ((c = in.read()) != -1) {
            if (c == '\n') break;
            if (c != '\r') bo.write(c);
        }
        if (c == -1 && bo.size() == 0) throw new EOFException("connection closed");
        return bo.toString("UTF-8");
    }

    void send(String line) throws IOException {
        out.write((line + "\r\n").getBytes("UTF-8"));
        out.flush();
    }

    int lastLitCount() { return lastLits.size(); }
    byte[] lastLit(int i) { return lastLits.get(i); }

    void cmd(String command) throws Exception {
        String tag = "a" + (++tagN);
        send(tag + " " + command);
        lastLines = new ArrayList<>();
        lastLits = new ArrayList<>();
        while (true) {
            Line ln = readLine();
            lastLines.add(ln.text);
            lastLits.addAll(ln.lits);
            if (ln.text.startsWith(tag + " ")) {
                String verdict = ln.text.substring(tag.length() + 1);
                if (verdict.startsWith("NO") || verdict.startsWith("BAD"))
                    throw new IOException("IMAP error: " + verdict);
                break;
            }
        }
    }

    public void markSeen(String uid) throws Exception {
        cmd("UID STORE " + uid + " +FLAGS (\\Seen)");
    }

    public List<Msg> unseen() throws Exception {
        cmd("UID SEARCH UNSEEN");
        StringBuilder uids = new StringBuilder();
        for (String l : lastLines) if (l.startsWith("* SEARCH")) uids.append(l.substring(8).trim()).append(' ');
        List<Msg> out = new ArrayList<>();
        for (String u : uids.toString().trim().split("\\s+")) {
            if (u.isEmpty() || u.equals("0")) continue;
            Msg m = new Msg();
            m.uid = u;
            cmd("UID FETCH " + u + " (BODY.PEEK[HEADER.FIELDS (FROM SUBJECT)])");
            if (!lastLits.isEmpty()) {
                String hs = new String(lastLits.get(0), "UTF-8");
                String f = header(hs, "From:");
                if (f != null) m.from = dec(f);
                String sj = header(hs, "Subject:");
                if (sj != null) m.subject = dec(sj);
            }
            cmd("UID FETCH " + u + " (BODY.PEEK[TEXT]<0.3000>)");
            if (!lastLits.isEmpty()) m.body = new String(lastLits.get(0), "UTF-8").trim();
            out.add(m);
        }
        return out;
    }

    static String header(String blob, String key) {
        String lb = blob.toLowerCase(), lk = key.toLowerCase();
        int i = lb.indexOf(lk);
        if (i < 0) return null;
        int j = blob.indexOf("\r\n", i);
        return blob.substring(i + key.length(), j < 0 ? blob.length() : j).trim();
    }

    static String dec(String v) {
        StringBuilder sb = new StringBuilder();
        Matcher m = Pattern.compile("=\\?([^?]+)\\?([bBqQ])\\?([^?]*)\\?=").matcher(v);
        int last = 0;
        while (m.find()) {
            sb.append(v.substring(last, m.start()));
            try {
                String cs = m.group(1).toLowerCase().contains("iso-8859") ? "ISO-8859-1" : "UTF-8";
                String payload = m.group(3);
                if (m.group(2).equalsIgnoreCase("B")) {
                    sb.append(new String(android.util.Base64.decode(payload, android.util.Base64.DEFAULT), cs));
                } else {
                    byte[] b = new byte[payload.length()];
                    int n = 0;
                    for (int i = 0; i < payload.length(); i++) {
                        char c = payload.charAt(i);
                        if (c == '=' && i + 2 < payload.length()) {
                            b[n++] = (byte) Integer.parseInt(payload.substring(i + 1, i + 3), 16);
                            i += 2;
                        } else if (c == '_') b[n++] = ' ';
                        else b[n++] = (byte) c;
                    }
                    sb.append(new String(b, 0, n, cs));
                }
            } catch (Throwable t) { sb.append(m.group(0)); }
            last = m.end();
        }
        sb.append(v.substring(last));
        return sb.toString().trim();
    }

    public void close() {
        try { send("a logout"); } catch (Throwable ignore) {}
        try { s.close(); } catch (Throwable ignore) {}
    }
}
