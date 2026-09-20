package com.world.revolution;

import android.content.Intent;
import android.os.Looper;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "WRNPlatform")
public class WRNPlatformPlugin extends Plugin {
    private final WRNPlatformPolicy policy = new WRNPlatformPolicy();

    @Override
    public void load() {
        super.load();
        // A cold ACTION_VIEW is the activity's initial intent, not onNewIntent.
        // The existing retained event waits for the WebView route listener.
        handleOnNewIntent(getActivity().getIntent());
    }

    @Override
    protected void handleOnNewIntent(Intent intent) {
        if (intent == null || !Intent.ACTION_VIEW.equals(intent.getAction())) return;
        String raw = intent.getDataString();
        getActivity().runOnUiThread(() -> {
            String route = policy.parseDeepLink(raw);
            if (route == null) return;
            JSObject event = new JSObject();
            event.put("deliveryId", policy.nextRouteDeliveryId());
            event.put("route", route);
            notifyListeners("route", event, true);
        });
    }

    @PluginMethod
    public void share(PluginCall call) {
        String raw = call.getString("url");
        getActivity().runOnUiThread(() -> shareOnMain(call, raw));
    }

    private void shareOnMain(PluginCall call, String raw) {
        String canonical = policy.canonicalShareUrl(raw);
        if (canonical == null) {
            call.reject("Only canonical World Revolution News article URLs can be shared.");
            return;
        }
        try {
            Intent shareIntent = new Intent(Intent.ACTION_SEND);
            shareIntent.setType("text/plain");
            shareIntent.putExtra(Intent.EXTRA_TEXT, canonical);
            getActivity().startActivity(Intent.createChooser(shareIntent, "Share article"));
            call.resolve();
        } catch (Exception exception) {
            call.reject("Share chooser could not be opened.", exception);
        }
    }

    @PluginMethod
    public void setWebReady(PluginCall call) {
        boolean ready = call.getBoolean("ready", false);
        getActivity().runOnUiThread(() -> {
            policy.setWebReady(ready);
            call.resolve();
        });
    }

    @PluginMethod
    public void acknowledgeBack(PluginCall call) {
        String requestId = call.getString("requestId");
        getActivity().runOnUiThread(() -> {
            if (!policy.consumeBackAcknowledgement(requestId)) {
                call.reject("Stale or invalid Back acknowledgement.");
                return;
            }
            getActivity().finish();
            call.resolve();
        });
    }

    boolean requestSystemBack() {
        // MainActivity's AndroidX dispatcher runs on main. Reject a future
        // off-main caller instead of racing worker-thread bridge methods.
        if (Looper.myLooper() != Looper.getMainLooper()) {
            throw new IllegalStateException("System Back must run on the main thread.");
        }
        String requestId = policy.createBackRequestId();
        if (requestId == null) return false;
        JSObject event = new JSObject();
        event.put("requestId", requestId);
        notifyListeners("back", event);
        return true;
    }

    @Override
    protected void handleOnDestroy() {
        getActivity().runOnUiThread(() -> policy.setWebReady(false));
    }
}
