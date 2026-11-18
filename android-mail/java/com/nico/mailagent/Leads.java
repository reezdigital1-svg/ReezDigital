package com.nico.mailagent;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.*;
import java.util.regex.*;

/** Lead harvester: fingerprints Shopify and WooCommerce stores, pulls products and contact emails. */
public class Leads {
    static final String UA = "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36";

    public static String http(String url, boolean quiet) throws Exception {
        HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
        c.setConnectTimeout(15000);
        c.setReadTimeout(20000);
        c.setRequestProperty("User-Agent", UA);
        c.setInstanceFollowRedirects(true);
        int code = c.getResponseCode();
        InputStream in = code < 400 ? c.getInputStream() : c.getErrorStream();
        ByteArrayOutputStream bo = new ByteArrayOutputStream();
        byte[] b = new byte[8192];
        int n;
        while (in != null && (n = in.read(b)) > 0) {
            bo.write(b, 0, n);
            if (bo.size() > 2500000) break;
        }
        if (in != null) in.close();
        if (code >= 400 && !quiet) throw new IOException("HTTP " + code + " for " + url);
        return bo.toString("UTF-8");
    }

    public static String scan(String rawUrl, StringBuilder emailsOut, StringBuilder storeType) {
        StringBuilder rep = new StringBuilder();
        String u = rawUrl.trim();
        if (!u.startsWith("http")) u = "https://" + u;
        String base = "https://" + u.replaceFirst("^https?://", "").replaceAll("/+$", "");

        String html;
        try { html = http(base, false); }
        catch (Throwable t) {
            try { html = http(base, false); }
            catch (Throwable t2) { return "Could not reach " + base + " (" + t2 + "). Check the URL."; }
        }

        boolean shopify = html.contains("cdn.shopify.com") || html.toLowerCase().contains("window.shopify") || html.toLowerCase().contains("shopify.theme");
        boolean woo = html.toLowerCase().contains("woocommerce") || html.contains("/wp-content/") || html.contains("/wp-json/");

        LinkedHashSet<String> em = harvest(html);
        for (String pg : new String[]{"/pages/contact", "/pages/about-us", "/contact", "/about", "/pages/contact-us"}) {
            try {
                Thread.sleep(350);
                em.addAll(harvest(http(base + pg, true)));
            } catch (Throwable ignore) {}
        }

        int products = 0;
        String platform = "unknown";
        if (shopify) {
            try {
                Thread.sleep(350);
                String js = http(base + "/products.json?limit=50", true);
                products = countJsonStrings(js, "\"title\":\"");
            } catch (Throwable ignore) {}
            platform = "Shopify";
        }
        if (products == 0 && woo) {
            try {
                Thread.sleep(350);
                String js = http(base + "/wp-json/wc/store/v1/products?per_page=20", true);
                products = countJsonStrings(js, "\"name\":\"");
                woo = js.contains("\"name\"") || woo;
            } catch (Throwable ignore) {}
            platform = "WooCommerce";
        }
        if ("unknown".equals(platform) && (woo || html.contains("wp-"))) platform = "WooCommerce";

        rep.append("STORE: ").append(base).append("\n");
        rep.append("PLATFORM: ").append(platform);
        if (shopify || woo) rep.append(" (confirmed)");
        rep.append("\n");
        if (products > 0) rep.append("PRODUCTS VISIBLE: ").append(products).append("\n");
        if (em.isEmpty()) {
            rep.append("EMAILS: none found on the first pass. Try the store's real contact page or a different URL.\n");
        } else {
            rep.append("EMAILS FOUND: ").append(em.size()).append("\n");
            for (String e : em) rep.append("  ").append(e).append("\n");
            for (String e : em) emailsOut.append(e).append("\n");
        }
        if (storeType.length() == 0 && (!"unknown".equals(platform))) storeType.append(platform);
        return rep.toString();
    }

    static LinkedHashSet<String> harvest(String html) {
        LinkedHashSet<String> em = new LinkedHashSet<>();
        Matcher m = Pattern.compile("[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\\.[A-Za-z0-9-]+)*\\.[A-Za-z]{2,}").matcher(html);
        while (m.find()) {
            String e = m.group().toLowerCase();
            if (e.endsWith(".png") || e.endsWith(".jpg") || e.endsWith(".webp") || e.endsWith(".gif")) continue;
            if (e.contains("example.") || e.contains("sentry") || e.contains("@2x") || e.contains("domain.com")) continue;
            em.add(e);
        }
        return em;
    }

    static int countJsonStrings(String js, String key) {
        int n = 0, i = 0;
        while ((i = js.indexOf(key, i)) >= 0) { n++; i += key.length(); }
        return n;
    }
}
