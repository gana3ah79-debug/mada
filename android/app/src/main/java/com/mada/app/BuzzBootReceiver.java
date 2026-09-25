package com.mada.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.provider.Settings;

public class BuzzBootReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context context, Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();
        if (!Intent.ACTION_BOOT_COMPLETED.equals(action) && !Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)) return;
        if (Build.VERSION.SDK_INT >= 23 && !Settings.canDrawOverlays(context)) return;
        try {
            Intent service = new Intent(context, BuzzService.class);
            if (Build.VERSION.SDK_INT >= 26) context.startForegroundService(service);
            else context.startService(service);
            Intent calls = new Intent(context, CallNotificationService.class);
            if (Build.VERSION.SDK_INT >= 26) context.startForegroundService(calls);
            else context.startService(calls);
        } catch (Exception ignored) {}
    }
}
