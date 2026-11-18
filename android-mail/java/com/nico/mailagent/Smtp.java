package com.nico.mailagent;

import java.io.*;
import java.net.Socket;
import javax.net.ssl.SSLSocketFactory;

/** Minimal SMTP over SSL (port 465). */
public class Smtp {
    public static void send(String host, int port, String user, String pass,
                            String from, String to, String subject, String body) throws Exception {
        Socket s = SSLSocketFactory.getDefault().createSocket(host, port);
        BufferedReader r = new BufferedReader(new InputStreamReader(s.getInputStream(), "UTF-8"));
        OutputStream w = s.getOutputStream();

        expect(r.readLine(), "220");
        write(w, "EHLO deck");
        while (true) {
            String l = r.readLine();
            if (l == null) throw new IOException("EHLO ended early");
            if (l.startsWith("250 ")) break;
            if (!l.startsWith("250-") && !l.startsWith("250 ")) throw new IOException("EHLO failed: " + l);
        }
        write(w, "AUTH LOGIN");
        expect(r.readLine(), "334");
        write(w, android.util.Base64.encodeToString(user.getBytes("UTF-8"), android.util.Base64.NO_WRAP));
        expect(r.readLine(), "334");
        write(w, android.util.Base64.encodeToString(pass.getBytes("UTF-8"), android.util.Base64.NO_WRAP));
        expect(r.readLine(), "235");
        write(w, "MAIL FROM:<" + user.trim() + ">"); expect(r.readLine(), "250");
        write(w, "RCPT TO:<" + to.trim() + ">"); expect(r.readLine(), "250");
        write(w, "DATA"); expect(r.readLine(), "354");

        StringBuilder mail = new StringBuilder();
        mail.append("From: ").append(user.trim()).append("\r\n");
        mail.append("To: ").append(to.trim()).append("\r\n");
        mail.append("Subject: =?UTF-8?B?")
            .append(android.util.Base64.encodeToString(subject.getBytes("UTF-8"), android.util.Base64.NO_WRAP))
            .append("?=\r\n");
        mail.append("MIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\n");
        mail.append("Content-Transfer-Encoding: 8bit\r\n\r\n");
        String b = body.replace("\r\n", "\n").replace("\r", "").replace("\n", "\r\n");
        for (String line : b.split("\r\n", -1)) {
            if (line.startsWith(".")) mail.append('.');
            mail.append(line).append("\r\n");
        }
        w.write(mail.toString().getBytes("UTF-8"));
        w.write(".\r\n".getBytes("UTF-8"));
        w.flush();
        expect(r.readLine(), "250");
        write(w, "QUIT");
        s.close();
    }

    static void write(OutputStream w, String line) throws IOException {
        w.write((line + "\r\n").getBytes("UTF-8"));
        w.flush();
    }

    static void expect(String line, String code) throws IOException {
        if (line == null || !line.startsWith(code))
            throw new IOException("SMTP unexpected: " + (line == null ? "(null)" : line));
    }
}
