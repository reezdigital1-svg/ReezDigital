package com.nico.deck;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.app.ActivityManager;
import android.app.PendingIntent;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;
import android.widget.Toast;
import java.util.List;

public class CareWidget extends AppWidgetProvider {
    static final String ACTION_FREE_RAM = "com.nico.deck.WIDGET_FREE_RAM";
    static final String ACTION_REFRESH = "com.nico.deck.WIDGET_REFRESH";

    @Override public void onUpdate(Context ctx, AppWidgetManager mgr, int[] ids) {
        for (int id : ids) mgr.updateAppWidget(id, views(ctx, null));
    }

    @Override public void onReceive(Context ctx, Intent i) {
        super.onReceive(ctx, i);
        String a = i.getAction();
        if (ACTION_FREE_RAM.equals(a)) {
            int n = 0;
            try {
                ActivityManager am = (ActivityManager) ctx.getSystemService(Context.ACTIVITY_SERVICE);
                ActivityManager.MemoryInfo before = new ActivityManager.MemoryInfo();
                am.getMemoryInfo(before);
                List<ActivityManager.RunningAppProcessInfo> procs = am.getRunningAppProcesses();
                if (procs != null) for (ActivityManager.RunningAppProcessInfo p : procs)
                    if (p.importance >= ActivityManager.RunningAppProcessInfo.IMPORTANCE_BACKGROUND) {
                        am.killBackgroundProcesses(p.processName); n++;
                    }
                ActivityManager.MemoryInfo after = new ActivityManager.MemoryInfo();
                am.getMemoryInfo(after);
                long freed = after.availMem - before.availMem;
                Toast.makeText(ctx, "FREE RAM: " + n + " app(s) trimmed, "
                        + (freed / 1048576) + " MB freed", Toast.LENGTH_LONG).show();
            } catch (Throwable t) {
                Toast.makeText(ctx, "free RAM failed: " + t, Toast.LENGTH_LONG).show();
            }
        }
        AppWidgetManager mgr = AppWidgetManager.getInstance(ctx);
        int[] ids = mgr.getAppWidgetIds(new ComponentName(ctx, CareWidget.class));
        for (int id : ids) mgr.updateAppWidget(id, views(ctx, null));
    }

    static RemoteViews views(Context ctx, String live) {
        RemoteViews v = new RemoteViews(ctx.getPackageName(), R.layout.widget_care);
        String status;
        try {
            ActivityManager am = (ActivityManager) ctx.getSystemService(Context.ACTIVITY_SERVICE);
            ActivityManager.MemoryInfo mi = new ActivityManager.MemoryInfo();
            am.getMemoryInfo(mi);
            status = "RAM free: " + String.format("%.2f GB", mi.availMem / 1073741824.0)
                    + (mi.lowMemory ? "  (LOW!)" : "");
        } catch (Throwable t) { status = "status unavailable"; }
        v.setTextViewText(R.id.widgetStatus, status);
        v.setOnClickPendingIntent(R.id.widgetBtn,
                PendingIntent.getBroadcast(ctx, 0,
                        new Intent(ctx, CareWidget.class).setAction(ACTION_FREE_RAM),
                        PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));
        v.setOnClickPendingIntent(R.id.widgetStatus,
                PendingIntent.getBroadcast(ctx, 1,
                        new Intent(ctx, CareWidget.class).setAction(ACTION_REFRESH),
                        PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));
        return v;
    }
}
