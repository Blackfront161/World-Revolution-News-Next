package com.world.revolution;

import androidx.activity.OnBackPressedCallback;
import androidx.core.splashscreen.SplashScreen;
import android.util.Log;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.PluginHandle;

public class MainActivity extends BridgeActivity {
    private WRNAppUpdateController appUpdates;

    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        SplashScreen.installSplashScreen(this);
        registerPlugin(WRNPlatformPlugin.class);
        super.onCreate(savedInstanceState);
        try { appUpdates = new WRNAppUpdateController(this); }
        catch (RuntimeException error) { Log.w("WRNPlayUpdates", "Play update support unavailable"); }
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                WRNPlatformPlugin plugin = getPlatformPlugin();
                if (plugin != null && plugin.requestSystemBack()) return;
                setEnabled(false);
                getOnBackPressedDispatcher().onBackPressed();
                setEnabled(true);
            }
        });
    }

    @Override public void onStart() {
        super.onStart();
        if (appUpdates != null) appUpdates.onStart();
    }

    @Override public void onResume() {
        super.onResume();
        if (appUpdates != null) appUpdates.onResume();
    }

    @Override public void onPause() {
        if (appUpdates != null) appUpdates.onPause();
        super.onPause();
    }

    @Override public void onStop() {
        if (appUpdates != null) appUpdates.onStop();
        super.onStop();
    }

    @Override public void onDestroy() {
        if (appUpdates != null) appUpdates.onDestroy();
        super.onDestroy();
    }

    private WRNPlatformPlugin getPlatformPlugin() {
        if (getBridge() == null) return null;
        PluginHandle handle = getBridge().getPlugin("WRNPlatform");
        if (handle == null || !(handle.getInstance() instanceof WRNPlatformPlugin)) return null;
        return (WRNPlatformPlugin) handle.getInstance();
    }
}
