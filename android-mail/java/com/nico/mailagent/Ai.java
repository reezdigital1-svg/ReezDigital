package com.nico.mailagent;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;

/** AI reply composer through the two free/cheap lanes the user already approved: mistral or openrouter. */
public class Ai {
    public static String reply(String provider, String key, String role,
                               String fromEmail, String subject, String bodyIn) throws Exception {
        provider = provider == null ? "openrouter" : provider.trim().toLowerCase();
        boolean mistral = provider.startsWith("mistral");
        String url = mistral ? "https://api.mistral.ai/v1/chat/completions"
                             : "https://openrouter.ai/api/v1/chat/completions";
        String model = mistral ? "mistral-small-latest" : "meta-llama/llama-3.3-70b-instruct:free";
        String sys = role == null || role.trim().isEmpty()
            ? "You are the owner of a small business answering customer email. Tone: warm, precise, short paragraphs. Never mention being an AI."
            : role;
        String usr = "Write the reply email to send FROM the business inbox. Reply ONLY with the email body text.\n\n"
            + "CUSTOMER EMAIL\nFROM: " + fromEmail + "\nSUBJECT: " + subject + "\nBODY:\n" + bodyIn;
        String payload = "{\"model\":\"" + model + "\",\"max_tokens\":480,\"temperature\":0.6,\"messages\":["
            + "{\"role\":\"system\",\"content\":\"" + jsEsc(sys) + "\"},"
            + "{\"role\":\"user\",\"content\":\"" + jsEsc(usr) + "\"}]}";
        HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
        c.setRequestMethod("POST");
        c.setRequestProperty("Content-Type", "application/json");
        c.setRequestProperty("Authorization", "Bearer " + key.trim());
        c.setConnectTimeout(20000);
        c.setReadTimeout(60000);
        c.setDoOutput(true);
        OutputStream os = c.getOutputStream();
        os.write(payload.getBytes("UTF-8"));
        os.close();
        int code = c.getResponseCode();
        InputStream in = code < 400 ? c.getInputStream() : c.getErrorStream();
        ByteArrayOutputStream bo = new ByteArrayOutputStream();
        byte[] buf = new byte[8192];
        int n;
        while (in != null && (n = in.read(buf)) > 0) bo.write(buf, 0, n);
        if (in != null) in.close();
        String out = bo.toString("UTF-8");
        if (code >= 400) throw new IOException("AI HTTP " + code + ": " + out.substring(0, Math.min(out.length(), 300)));
        String content = grab(out, "\"content\":\"");
        if (content.isEmpty()) throw new IOException("AI gave no content: " + out.substring(0, Math.min(out.length(), 300)));
        return content;
    }

    public static String template(String role, String subject, String bodyIn) {
        String who = role == null || role.trim().isEmpty() ? "our team" : firstClause(role);
        return "Hello,\n\nThank you for your email about \"" + subject + "\". " + who
            + " has received your message and will follow up with more detail shortly.\n\nBest regards";
    }

    static String firstClause(String role) {
        String r = role.trim();
        int cut = r.indexOf('.');
        if (cut > 20 && cut < 120) return r.substring(0, cut);
        return r.length() > 110 ? r.substring(0, 110) : r;
    }

    static String jsEsc(String s) {
        return s.replace("\\", "\\\\").replace("\"", "\\\"")
                .replace("\r", "").replace("\n", "\\n").replace("\t", "\\t");
    }

    static String grab(String s, String key) {
        int i = s.indexOf(key);
        if (i < 0) return "";
        return unquote(s.substring(i + key.length()));
    }

    static String unquote(String s) {
        StringBuilder b = new StringBuilder();
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c == '\\' && i + 1 < s.length()) {
                char n = s.charAt(i + 1); i++;
                if (n == 'n') b.append('\n');
                else if (n == 't') b.append('\t');
                else if (n == '"') b.append('"');
                else if (n == '\\') b.append('\\');
                else if (n == 'u' && i + 4 < s.length()) {
                    try { b.append((char) Integer.parseInt(s.substring(i + 1, i + 5), 16)); i += 4; }
                    catch (Throwable ignore) {}
                } else b.append(n);
            } else if (c == '"') break;
            else b.append(c);
        }
        return b.toString();
    }
}
