package com.nico.mailagent;

import android.app.Activity;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.Typeface;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;

public class MainActivity extends Activity {
    static final int BG = 0xFF0A0E1C, PANEL = 0xFF121A2C, LINE = 0xFF22304A;
    static final int TEXT = 0xFFEDF1F7, MUTED = 0xFFA7B3C7, AMBER = 0xFFF5B027, CYAN = 0xFF00F0FF;

    LinearLayout inboxView, sendView, leadsView, roleView, setupView;
    TextView statusLine, inboxList, leadsOut;
    EditText emUser, emPass, emImapH, emImapP, emSmtpH, emSmtpP,
             aiProvider, aiKey, roleText,
             sendTo, sendSub, sendBody, leadUrl;
    Button autoBtn;
    LinearLayout mailCards;
    List<Imap.Msg> unseen = new ArrayList<>();
    Handler handler = new Handler();
    boolean autoOn = false;

    @Override protected void onCreate(Bundle b) {
        super.onCreate(b);
        try { buildUi(); loadPrefs(); setStatus("ready. save your account in SETUP, then CHECK MAIL."); }
        catch (Throwable t) { fail(t); }
    }

    void buildUi() {
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(BG);

        TextView head = new TextView(this);
        head.setText("NICO MAIL AGENT \u00b7 reads, drafts, replies, hunts leads");
        head.setTextColor(AMBER);
        head.setTypeface(Typeface.MONOSPACE, Typeface.BOLD);
        head.setTextSize(13.5f);
        head.setPadding(px(14), px(12), px(14), px(6));
        root.addView(head);

        statusLine = new TextView(this);
        statusLine.setTextColor(MUTED);
        statusLine.setTypeface(Typeface.MONOSPACE);
        statusLine.setTextSize(10.5f);
        statusLine.setPadding(px(14), 0, px(14), px(6));
        root.addView(statusLine);

        LinearLayout tabs = new LinearLayout(this);
        tabs.setPadding(px(8), px(2), px(8), px(4));
        String[] names = {"SETUP", "INBOX", "SEND", "LEADS", "ROLE"};
        for (final String n : names) {
            Button t = new Button(this);
            t.setText(n);
            t.setTextColor(TEXT);
            t.setTextSize(10.5f);
            t.setAllCaps(false);
            t.setPadding(0, 0, 0, 0);
            t.setBackgroundColor(PANEL);
            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
            lp.setMargins(px(3), 0, px(3), 0);
            t.setLayoutParams(lp);
            t.setOnClickListener(v -> switchTab(n));
            tabs.addView(t);
        }
        root.addView(tabs);

        LinearLayout autoRow = new LinearLayout(this);
        autoRow.setPadding(px(8), px(2), px(8), px(2));
        autoBtn = bigBtn("AUTO-REPLY: OFF", () -> toggleAuto());
        LinearLayout.LayoutParams alp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        alp.setMargins(px(6), 0, px(6), px(4));
        autoBtn.setLayoutParams(alp);
        autoBtn.setBackgroundColor(CYAN);
        autoRow.addView(autoBtn);
        root.addView(autoRow);

        FrameLayout flip = new FrameLayout(this);
        flip.setBackgroundColor(BG);

        setupView = buildSetupPanel();
        inboxView = buildInboxPanel();
        sendView = buildSendPanel();
        leadsView = buildLeadsPanel();
        roleView = buildRolePanel();
        flip.addView(setupView); flip.addView(inboxView); flip.addView(sendView);
        flip.addView(leadsView); flip.addView(roleView);

        root.addView(flip, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));
        setContentView(root);
        switchTab("SETUP");
    }

    void switchTab(String n) {
        setupView.setVisibility("SETUP".equals(n) ? View.VISIBLE : View.GONE);
        inboxView.setVisibility("INBOX".equals(n) ? View.VISIBLE : View.GONE);
        sendView.setVisibility("SEND".equals(n) ? View.VISIBLE : View.GONE);
        leadsView.setVisibility("LEADS".equals(n) ? View.VISIBLE : View.GONE);
        roleView.setVisibility("ROLE".equals(n) ? View.VISIBLE : View.GONE);
        if ("ROLE".equals(n) && roleText != null && roleText.getText() == null) loadPrefs();
    }

    // SETUP ---------------------------------------------------------------
    LinearLayout buildSetupPanel() {
        LinearLayout p = panel();
        p.addView(section("MAIL ACCOUNT \u00b7 app password, not your normal password"));
        emUser = input("email address (e.g. you@gmail.com)");
        p.addView(emUser);
        emPass = input("mail app password (for gmail: enable 2-step verification, then myaccount.google.com > security > app passwords)");
        emPass.setTransformationMethod(android.text.method.PasswordTransformationMethod.getInstance());
        p.addView(emPass);
        LinearLayout row1 = new LinearLayout(this); row1.setOrientation(LinearLayout.HORIZONTAL);
        emImapH = input("imap host"); emImapH.setText("imap.gmail.com");
        emImapP = input("port"); emImapP.setText("993");
        LinearLayout.LayoutParams hp1 = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 3f);
        hp1.setMargins(0, px(4), px(4), 0); emImapH.setLayoutParams(hp1);
        LinearLayout.LayoutParams hp2 = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
        hp2.setMargins(0, px(4), 0, 0); emImapP.setLayoutParams(hp2);
        row1.addView(emImapH); row1.addView(emImapP);
        p.addView(row1);
        LinearLayout row2 = new LinearLayout(this); row2.setOrientation(LinearLayout.HORIZONTAL);
        emSmtpH = input("smtp host"); emSmtpH.setText("smtp.gmail.com");
        emSmtpP = input("port"); emSmtpP.setText("465");
        LinearLayout.LayoutParams sp1 = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 3f);
        sp1.setMargins(0, px(4), px(4), 0); emSmtpH.setLayoutParams(sp1);
        LinearLayout.LayoutParams sp2 = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
        sp2.setMargins(0, px(4), 0, 0); emSmtpP.setLayoutParams(sp2);
        row2.addView(emSmtpH); row2.addView(emSmtpP);
        p.addView(row2);

        p.addView(section("AI BRAIN \u00b7 free lane keys"));
        aiProvider = input("provider: mistral or openrouter (free:free models)");
        aiProvider.setText("openrouter");
        p.addView(aiProvider);
        aiKey = input("api key (openrouter.ai/keys free tier, or console.mistral.ai free tier)");
        p.addView(aiKey);

        p.addView(bigBtn("SAVE SETTINGS (kept on this phone only)", () -> {
            savePrefs();
            Toast.makeText(this, "saved on this phone only", Toast.LENGTH_SHORT).show();
        }));
        TextView note = plain("Gmail needs an APP PASSWORD: turn on 2-Step Verification, then Google Account > Security > App passwords, create one, paste it above. Your normal password will fail IMAP on purpose. The password lives only in this app's private storage, we never send it anywhere except your mail server. Yahoo/Outlook: imap.mail.yahoo.com / outlook.office365.com with their own app passwords.");
        p.addView(note);
        ScrollView sc = wrap(p);
        LinearLayout outer = new LinearLayout(this);
        outer.setOrientation(LinearLayout.VERTICAL);
        outer.addView(sc, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));
        return outer;
    }

    // INBOX ---------------------------------------------------------------
    LinearLayout buildInboxPanel() {
        LinearLayout p = panel();
        p.addView(bigBtn("CHECK MAIL FOR NEW MESSAGES", () -> checkMail(false)));
        mailCards = new LinearLayout(this);
        mailCards.setOrientation(LinearLayout.VERTICAL);
        p.addView(mailCards);
        p.addView(wrap(p));
        LinearLayout outer = new LinearLayout(this);
        outer.setOrientation(LinearLayout.VERTICAL);
        outer.addView(p, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));
        return outer;
    }

    LinearLayout mailCard(final Imap.Msg m) {
        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setBackgroundColor(PANEL);
        card.setPadding(px(10), px(8), px(10), px(8));
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        lp.setMargins(0, 0, 0, px(8));
        card.setLayoutParams(lp);

        TextView t1 = new TextView(this);
        t1.setTextColor(TEXT); t1.setTextSize(13); t1.setTypeface(null, Typeface.BOLD);
        t1.setText(m.subject);
        TextView t2 = new TextView(this);
        t2.setTextColor(CYAN); t2.setTextSize(11);
        t2.setText("from: " + m.from);
        TextView t3 = new TextView(this);
        t3.setTextColor(MUTED); t3.setTextSize(10.5f); t3.setMaxLines(3);
        t3.setText(m.body.length() > 220 ? m.body.substring(0, 220) + "..." : m.body);
        card.addView(t1); card.addView(t2); card.addView(t3);

        LinearLayout row = new LinearLayout(this); row.setOrientation(LinearLayout.HORIZONTAL);
        Button r = smallBtn("WRITE AI REPLY", () -> draftReply(m));
        Button s = smallBtn("MARK READ", () -> { new Thread(() -> { try { Imap im = connectImap(); im.markSeen(m.uid); im.close(); uiStatus("marked read"); } catch (Throwable t) { uiStatus("mark read failed: " + t); } }).start(); });
        row.addView(r); row.addView(s);
        card.addView(row);
        return card;
    }

    // SEND ----------------------------------------------------------------
    LinearLayout buildSendPanel() {
        LinearLayout p = panel();
        p.addView(section("COMPOSE \u00b7 role is attached automatically"));
        sendTo = input("to (email address)");
        p.addView(sendTo);
        sendSub = input("subject");
        p.addView(sendSub);
        sendBody = input("message body"); sendBody.setSingleLine(false); sendBody.setMinLines(5); sendBody.setGravity(Gravity.TOP);
        p.addView(sendBody);
        p.addView(bigBtn("AI DRAFT FROM LAST READ EMAIL", this::aiDraft));
        p.addView(bigBtn("SEND MAIL", this::sendNow));
        p.addView(bigBtn("CLEAR", () -> { sendTo.setText(""); sendSub.setText(""); sendBody.setText(""); }));
        p.addView(wrap(p));
        LinearLayout outer = new LinearLayout(this);
        outer.setOrientation(LinearLayout.VERTICAL);
        outer.addView(p, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));
        return outer;
    }

    // LEADS ---------------------------------------------------------------
    LinearLayout buildLeadsPanel() {
        LinearLayout p = panel();
        p.addView(section("LEAD HUNTER \u00b7 shopify + woocommerce"));
        leadUrl = input("store or website URL (one per scan)");
        p.addView(leadUrl);
        p.addView(bigBtn("SCAN FOR LEADS", () -> runScan()));
        leadsOut = new TextView(this);
        leadsOut.setTextColor(MUTED); leadsOut.setTypeface(Typeface.MONOSPACE);
        leadsOut.setTextSize(11); leadsOut.setTextIsSelectable(true);
        leadsOut.setPadding(px(4), px(8), px(4), px(8));
        leadsOut.setText("site examples: anyshop.myshopify.com, mystore.com. The scanner fingerprints the platform, reads its public product feed and scrapes contact emails from the site and its contact/about pages.");
        p.addView(leadsOut);
        p.addView(bigBtn("COPY ALL FOUND EMAILS", () -> {
            try {
                ClipboardManager cm = (ClipboardManager) getSystemService(CLIPBOARD_SERVICE);
                cm.setPrimaryClip(ClipData.newPlainText("leads", leadsOut.getText().toString()));
                Toast.makeText(this, "copied", Toast.LENGTH_SHORT).show();
            } catch (Throwable t) { Toast.makeText(this, "copy failed", Toast.LENGTH_SHORT).show(); }
        }));
        p.addView(bigBtn("DRAFT OUTREACH TO FIRST EMAIL", () -> {
            Matcher e = java.util.regex.Pattern.compile("[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+").matcher(leadsOut.getText().toString());
            if (e.find()) {
                sendTo.setText(e.group());
                if (sendSub.getText() == null || sendSub.getText().toString().trim().isEmpty())
                    sendSub.setText("Quick question about your store");
                switchTab("SEND");
                Toast.makeText(this, "draft for " + e.group() + " ready: press AI DRAFT, edit, then SEND", Toast.LENGTH_LONG).show();
            } else Toast.makeText(this, "no email in results yet", Toast.LENGTH_SHORT).show();
        }));
        p.addView(plain("Honest limits: one store per scan with polite pacing. Cold bulk sending will get your Gmail rate-limited or suspended, so send outreach in small, personal batches under the Gmail daily cap (about 500)."));
        p.addView(wrap(p));
        LinearLayout outer = new LinearLayout(this);
        outer.setOrientation(LinearLayout.VERTICAL);
        outer.addView(p, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));
        return outer;
    }

    // ROLE ----------------------------------------------------------------
    LinearLayout buildRolePanel() {
        LinearLayout p = panel();
        p.addView(section("YOUR ROLE \u00b7 pasted into every reply"));
        roleText = input("Paste the role here. Example: You are the customer lead for NICO AI STUDIO. You write short warm replies, answer questions about pricing ($5 per skill), quote turnaround the same day, and always end with a call to action.");
        roleText.setSingleLine(false);
        roleText.setMinLines(9);
        roleText.setGravity(Gravity.TOP);
        p.addView(roleText);
        p.addView(bigBtn("SAVE ROLE", () -> { savePrefs(); Toast.makeText(this, "role saved on this phone", Toast.LENGTH_SHORT).show(); }));
        p.addView(plain("The role is used as the AI's system instruction for AI DRAFT and every auto-reply. With no key set the agent falls back to a plain template that quotes your role, and it never pretends to be an AI letter when it is not."));
        p.addView(wrap(p));
        LinearLayout outer = new LinearLayout(this);
        outer.setOrientation(LinearLayout.VERTICAL);
        outer.addView(p, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));
        return outer;
    }

    // actions -------------------------------------------------------------
    Imap connectImap() throws Exception {
        Imap im = new Imap();
        im.open(pref("imaph", "imap.gmail.com"), Integer.parseInt(pref("imapp", "993")),
                pref("user", ""), pref("pass", ""));
        return im;
    }

    void checkMail(final boolean auto) {
        uiStatus("checking mail...");
        new Thread(() -> {
            try {
                Imap im = connectImap();
                List<Imap.Msg> got = im.unseen();
                im.close();
                unseen = got;
                runOnUiThread(() -> {
                    mailCards.removeAllViews();
                    TextView h = new TextView(this);
                    h.setTextColor(AMBER); h.setTextSize(12); h.setTypeface(null, Typeface.BOLD);
                    h.setPadding(px(4), px(6), px(4), px(6));
                    h.setText(got.isEmpty() ? "inbox clear: no unseen mail" : got.size() + " unseen message(s)");
                    mailCards.addView(h);
                    for (Imap.Msg m : got) mailCards.addView(mailCard(m));
                    setStatus("checked: " + got.size() + " unseen");
                });
                if (auto && !got.isEmpty()) autoReplyAll();
            } catch (final Throwable t) {
                runOnUiThread(() -> setStatus("mail check failed: " + t));
            }
        }).start();
    }

    void draftReply(Imap.Msg m) {
        sendTo.setText(addr(m.from));
        sendSub.setText(m.subject == null || m.subject.toLowerCase().startsWith("re:") ? m.subject : "Re: " + m.subject);
        aiDraft();
        switchTab("SEND");
    }

    void aiDraft() {
        final String to = sendTo.getText().toString().trim();
        if (to.isEmpty()) { Toast.makeText(this, "no recipient: read a mail first or set TO", Toast.LENGTH_SHORT).show(); return; }
        Imap.Msg last = unseen.isEmpty() ? null : unseen.get(unseen.size() - 1);
        final String subj = sendSub.getText().toString().trim();
        final String orig = last != null ? last.body : "";
        uiStatus("AI drafting...");
        new Thread(() -> {
            String out;
            try {
                out = Ai.reply(pref("provider", "openrouter"), pref("key", ""), pref("role", ""), to, subj, orig);
            } catch (Throwable t) {
                out = Ai.template(pref("role", ""), subj, orig) + "\n\n(no AI key or AI failed: " + t + ")";
            }
            final String f = out;
            runOnUiThread(() -> { sendBody.setText(f); setStatus("draft ready, read it then press SEND"); });
        }).start();
    }

    void sendNow() {
        final String to = sendTo.getText().toString().trim();
        final String sub = sendSub.getText().toString().trim();
        final String body = sendBody.getText().toString().trim();
        if (to.isEmpty() || body.isEmpty()) { Toast.makeText(this, "need to + body", Toast.LENGTH_SHORT).show(); return; }
        if (sub.isEmpty()) { Toast.makeText(this, "need a subject", Toast.LENGTH_SHORT).show(); return; }
        uiStatus("sending to " + to + "...");
        new Thread(() -> {
            try {
                Smtp.send(pref("smtph", "smtp.gmail.com"), Integer.parseInt(pref("smtpp", "465")),
                        pref("user", ""), pref("pass", ""), pref("user", ""), to, sub, body);
                runOnUiThread(() -> { setStatus("sent to " + to); Toast.makeText(this, "mail sent", Toast.LENGTH_SHORT).show(); });
            } catch (final Throwable t) {
                runOnUiThread(() -> setStatus("send failed: " + t));
            }
        }).start();
    }

    void autoReplyAll() {
        List<Imap.Msg> todo = new ArrayList<>(unseen);
        int cap = Math.min(todo.size(), 10);
        for (int i = 0; i < cap; i++) {
            final Imap.Msg m = todo.get(i);
            try {
                String draft;
                try { draft = Ai.reply(pref("provider", "openrouter"), pref("key", ""), pref("role", ""), addr(m.from), m.subject, m.body); }
                catch (Throwable t) { draft = Ai.template(pref("role", ""), m.subject, m.body); }
                Smtp.send(pref("smtph", "smtp.gmail.com"), Integer.parseInt(pref("smtpp", "465")),
                        pref("user", ""), pref("pass", ""), pref("user", ""), addr(m.from), m.subject, draft);
                try { Imap im = connectImap(); im.markSeen(m.uid); im.close(); } catch (Throwable ignore) {}
                final int n = i + 1;
                runOnUiThread(() -> setStatus("auto-replied " + n + "/" + cap + ": " + m.subject));
                Thread.sleep(1500);
            } catch (final Throwable t) {
                runOnUiThread(() -> setStatus("auto-reply stopped: " + t));
                return;
            }
        }
        runOnUiThread(() -> { setStatus("auto-reply done: " + cap + " handled"); checkMail(false); });
    }

    void toggleAuto() {
        autoOn = !autoOn;
        autoBtn.setText(autoOn ? "AUTO-REPLY: ON (checks every 5 min)" : "AUTO-REPLY: OFF");
        if (autoOn) {
            Toast.makeText(this, "auto-reply on. The app checks while it stays open.", Toast.LENGTH_LONG).show();
            handler.postDelayed(autoTick, 15000);
        } else handler.removeCallbacks(autoTick);
    }

    final Runnable autoTick = new Runnable() {
        public void run() {
            if (autoOn) { checkMail(true); handler.postDelayed(this, 5 * 60 * 1000); }
        }
    };

    void runScan() {
        final String u = leadUrl.getText().toString().trim();
        if (u.isEmpty()) { Toast.makeText(this, "paste a store URL first", Toast.LENGTH_SHORT).show(); return; }
        uiStatus("scanning " + u + "...");
        final StringBuilder emails = new StringBuilder();
        final StringBuilder st = new StringBuilder();
        new Thread(() -> {
            String rep;
            try { rep = Leads.scan(u, emails, st); }
            catch (Throwable t) { rep = "scan failed: " + t; }
            final String f = rep;
            runOnUiThread(() -> { leadsOut.setText(f); setStatus("scan done"); });
        }).start();
    }

    // helpers -------------------------------------------------------------
    String addr(String from) {
        java.util.regex.Matcher m = java.util.regex.Pattern.compile("<([^>]+)>").matcher(from);
        if (m.find()) return m.group(1);
        return from.trim();
    }

    String pref(String k, String def) {
        return getSharedPreferences("mail", MODE_PRIVATE).getString(k, def);
    }

    void savePrefs() {
        SharedPreferences.Editor sp = getSharedPreferences("mail", MODE_PRIVATE).edit();
        sp.putString("user", emUser.getText().toString().trim());
        sp.putString("pass", emPass.getText().toString().trim());
        sp.putString("imaph", emImapH.getText().toString().trim());
        sp.putString("imapp", emImapP.getText().toString().trim());
        sp.putString("smtph", emSmtpH.getText().toString().trim());
        sp.putString("smtpp", emSmtpP.getText().toString().trim());
        sp.putString("provider", aiProvider.getText().toString().trim());
        sp.putString("key", aiKey.getText().toString().trim());
        sp.putString("role", roleText.getText().toString().trim());
        sp.apply();
    }

    void loadPrefs() {
        emUser.setText(pref("user", ""));
        emPass.setText(pref("pass", ""));
        emImapH.setText(pref("imaph", "imap.gmail.com"));
        emImapP.setText(pref("imapp", "993"));
        emSmtpH.setText(pref("smtph", "smtp.gmail.com"));
        emSmtpP.setText(pref("smtpp", "465"));
        aiProvider.setText(pref("provider", "openrouter"));
        aiKey.setText(pref("key", ""));
        roleText.setText(pref("role", ""));
    }

    void uiStatus(String s) { runOnUiThread(() -> setStatus(s)); }
    void setStatus(String s) { statusLine.setText(s); }

    void fail(Throwable t) {
        TextView fb = new TextView(this);
        fb.setTextColor(TEXT);
        fb.setText("The app hit a problem starting:\n\n" + t + "\n\nClose and reopen. If it repeats, send this text to the ring.");
        setContentView(fb);
    }

    LinearLayout panel() {
        LinearLayout p = new LinearLayout(this);
        p.setOrientation(LinearLayout.VERTICAL);
        p.setPadding(px(12), px(6), px(12), px(24));
        return p;
    }

    ScrollView wrap(LinearLayout p) {
        ScrollView sc = new ScrollView(this);
        sc.addView(p);
        return sc;
    }

    TextView section(String s) {
        TextView t = new TextView(this);
        t.setText(s);
        t.setTextColor(AMBER);
        t.setTypeface(Typeface.MONOSPACE, Typeface.BOLD);
        t.setTextSize(11.5f);
        t.setAllCaps(true);
        t.setPadding(0, px(14), 0, px(6));
        return t;
    }

    TextView plain(String s) {
        TextView t = new TextView(this);
        t.setTextColor(MUTED); t.setTextSize(11); t.setLineSpacing(0, 1.25f);
        t.setPadding(0, px(10), 0, px(8));
        t.setText(s);
        return t;
    }

    EditText input(String hint) {
        EditText e = new EditText(this);
        e.setHint(hint);
        e.setTextColor(TEXT); e.setHintTextColor(MUTED);
        e.setTextSize(12.5f);
        e.setBackgroundColor(PANEL);
        e.setPadding(px(10), px(8), px(10), px(8));
        return e;
    }

    Button bigBtn(String label, Runnable action) {
        Button b = new Button(this);
        b.setText(label);
        b.setTextColor(Color.BLACK);
        b.setTypeface(Typeface.DEFAULT_BOLD);
        b.setBackgroundColor(AMBER);
        b.setTextSize(12);
        b.setAllCaps(true);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        lp.setMargins(0, px(6), 0, px(6));
        b.setLayoutParams(lp);
        b.setOnClickListener(v -> action.run());
        return b;
    }

    Button smallBtn(String label, Runnable action) {
        Button b = new Button(this);
        b.setText(label);
        b.setTextColor(TEXT); b.setTextSize(9.5f); b.setAllCaps(false);
        b.setPadding(px(12), px(5), px(12), px(5));
        b.setBackgroundColor(LINE);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        lp.setMargins(px(3), 0, 0, 0);
        b.setLayoutParams(lp);
        b.setOnClickListener(v -> action.run());
        return b;
    }

    int px(int dip) { return Math.round(dip * getResources().getDisplayMetrics().density); }
}
