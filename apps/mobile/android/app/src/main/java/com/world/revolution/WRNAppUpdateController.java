package com.world.revolution;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.SharedPreferences;
import android.os.Handler;
import android.os.Looper;
import android.os.Bundle;
import android.util.Log;
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.IntentSenderRequest;
import androidx.activity.result.contract.ActivityResultContracts;

import com.google.android.play.core.appupdate.AppUpdateInfo;
import com.google.android.play.core.appupdate.AppUpdateManager;
import com.google.android.play.core.appupdate.AppUpdateManagerFactory;
import com.google.android.play.core.appupdate.AppUpdateOptions;
import com.google.android.play.core.install.InstallStateUpdatedListener;
import com.google.android.play.core.install.model.AppUpdateType;
import com.google.android.play.core.install.model.InstallStatus;
import com.google.android.play.core.install.model.UpdateAvailability;

/** Play owns update delivery and consent; WRN only manages foreground lifecycle. */
final class WRNAppUpdateController {
    private static final String TAG = "WRNPlayUpdates";
    private static final String LAST_FAILURE = "last_declined_or_failed_at";
    private static final String REGISTRY_KEY = "wrn_play_update_flow_v1";
    private static final String STATE_KEY = "wrn_play_update_session_v1";
    private final MainActivity activity;
    private final AppUpdateManager manager;
    private final SharedPreferences preferences;
    private final Handler main = new Handler(Looper.getMainLooper());
    private final WRNAppUpdateSession session = new WRNAppUpdateSession();
    private final ActivityResultLauncher<IntentSenderRequest> launcher;
    private final InstallStateUpdatedListener listener;
    private Runnable watchdog;
    private AlertDialog completionDialog;
    private boolean listenerRegistered;
    private boolean destroyed;

    WRNAppUpdateController(MainActivity activity) {
        this.activity = activity;
        manager = AppUpdateManagerFactory.create(activity);
        preferences = activity.getSharedPreferences("wrn_play_updates", Activity.MODE_PRIVATE);
        Bundle restored = activity.getSavedStateRegistry().consumeRestoredStateForKey(STATE_KEY);
        if (restored != null) session.restore(restored.getInt("version", -1), restored.getLong("generation", -1L), restored.getBoolean("open"), restored.getBoolean("failure"), restored.getInt("outstanding", -1));
        activity.getSavedStateRegistry().registerSavedStateProvider(STATE_KEY, () -> {
            Bundle state = new Bundle(); state.putInt("version", session.snapshotVersion()); state.putLong("generation", session.generation()); state.putBoolean("open", session.attemptOpen()); state.putBoolean("failure", session.failureRecorded()); state.putInt("outstanding", session.outstanding()); return state;
        });
        launcher = activity.getActivityResultRegistry().register(REGISTRY_KEY, activity,
            new ActivityResultContracts.StartIntentSenderForResult(),
            result -> onMain(() -> {
                if (session.consumeFlowResult() && result.getResultCode() != Activity.RESULT_OK)
                    recordFailure();
            })
        );
        listener = state -> onMain(() -> {
            if (!session.canRender()) return;
            if (state.installStatus() == InstallStatus.DOWNLOADED) showCompletionPrompt();
            else if (state.installStatus() == InstallStatus.FAILED || state.installStatus() == InstallStatus.CANCELED)
                recordFailure();
        });
    }

    private void onMain(Runnable action) {
        if (Looper.myLooper() == Looper.getMainLooper()) {
            if (!destroyed) action.run();
        } else main.post(() -> { if (!destroyed) action.run(); });
    }

    void onStart() {
        if (destroyed || listenerRegistered) return;
        try {
            manager.registerListener(listener);
            listenerRegistered = true;
        } catch (RuntimeException error) {
            Log.w(TAG, "Update listener unavailable");
        }
    }

    void onResume() {
        if (destroyed) return;
        session.resume();
        cancelWatchdog();
        long token = session.beginCheck();
        if (token == 0L) return;
        watchdog = () -> {
            if (session.finishCheck(token)) {
                watchdog = null;
                recordFailure();
                Log.w(TAG, "Update availability check timed out");
            }
        };
        main.postDelayed(watchdog, WRNAppUpdatePolicy.CHECK_TIMEOUT_MILLIS);
        try {
            manager.getAppUpdateInfo()
                .addOnSuccessListener(info -> onMain(() -> {
                    if (!session.finishCheck(token)) return;
                    cancelWatchdog();
                    handleInfo(info);
                }))
                .addOnFailureListener(error -> onMain(() -> {
                    if (!session.finishCheck(token)) return;
                    cancelWatchdog();
                    recordFailure();
                    Log.w(TAG, "Update availability unavailable");
                }));
        } catch (RuntimeException error) {
            if (session.finishCheck(token)) {
                cancelWatchdog();
                recordFailure();
                Log.w(TAG, "Update availability unavailable");
            }
        }
    }

    void onPause() {
        session.pause();
        cancelWatchdog();
        dismissCompletionPrompt();
    }

    void onStop() {
        onPause();
        if (!listenerRegistered) return;
        listenerRegistered = false;
        try { manager.unregisterListener(listener); }
        catch (RuntimeException error) { Log.w(TAG, "Update listener cleanup unavailable"); }
    }

    void onDestroy() {
        if (destroyed) return;
        onStop();
        destroyed = true;
        session.destroy();
        launcher.unregister();
        main.removeCallbacksAndMessages(null);
    }

    private void cancelWatchdog() {
        if (watchdog != null) main.removeCallbacks(watchdog);
        watchdog = null;
    }

    private void handleInfo(AppUpdateInfo info) {
        if (!session.canRender()) return;
        if (info.installStatus() == InstallStatus.DOWNLOADED) {
            showCompletionPrompt();
            return;
        }
        if (info.updateAvailability() == UpdateAvailability.DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS) {
            if (!info.isUpdateTypeAllowed(AppUpdateType.IMMEDIATE) || !session.claimImmediateResume()) return;
            startFlow(info, AppUpdateType.IMMEDIATE);
            return;
        }
        if (info.updateAvailability() != UpdateAvailability.UPDATE_AVAILABLE || !canPrompt()) return;
        WRNAppUpdatePolicy.Flow flow = WRNAppUpdatePolicy.choose(false, info.updatePriority(),
            info.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE), info.isUpdateTypeAllowed(AppUpdateType.IMMEDIATE));
        if (flow == WRNAppUpdatePolicy.Flow.NONE || !session.claimOrdinaryFlow(true)) return;
        session.acceptOrdinaryLaunch();
        startFlow(info, flow == WRNAppUpdatePolicy.Flow.IMMEDIATE ? AppUpdateType.IMMEDIATE : AppUpdateType.FLEXIBLE);
    }

    private void startFlow(AppUpdateInfo info, int type) {
        try {
            if (!manager.startUpdateFlowForResult(info, launcher, AppUpdateOptions.newBuilder(type).build())) {
                session.abandonLaunch();
                recordFailure();
            }
        } catch (RuntimeException error) {
            session.abandonLaunch();
            recordFailure();
            Log.w(TAG, "Update consent flow unavailable");
        }
    }

    private void recordFailure() {
        if (!session.recordFailure()) return;
        try {
            preferences.edit().putLong(LAST_FAILURE, System.currentTimeMillis()).apply();
        } catch (RuntimeException error) {
            Log.w(TAG, "Update cooldown storage unavailable");
        }
    }

    private boolean canPrompt() {
        try {
            return WRNAppUpdatePolicy.canPrompt(
                System.currentTimeMillis(), preferences.getLong(LAST_FAILURE, 0L));
        } catch (RuntimeException error) {
            // Preserve malformed/unavailable storage and leave the app usable.
            recordFailure();
            return false;
        }
    }

    private void showCompletionPrompt() {
        if (completionDialog != null || activity.isFinishing() || activity.isDestroyed()) return;
        long token = session.claimCompletionPrompt();
        if (token == 0L) return;
        try {
            completionDialog = new AlertDialog.Builder(activity)
            .setTitle(R.string.update_ready_title)
            .setMessage(R.string.update_ready_message)
            .setPositiveButton(R.string.update_restart_action, (dialog, which) -> {
                if (!session.finishCompletionPrompt(token)) return;
                try {
                    manager.completeUpdate().addOnFailureListener(error -> onMain(this::completionFailed));
                } catch (RuntimeException error) { completionFailed(); }
            })
            .setNegativeButton(R.string.update_later_action, (dialog, which) -> session.finishCompletionPrompt(token))
            .setOnCancelListener(dialog -> session.finishCompletionPrompt(token))
            .setOnDismissListener(dialog -> { if (completionDialog == dialog) completionDialog = null; })
            .create();
            completionDialog.show();
        } catch (RuntimeException error) {
            session.finishCompletionPrompt(token);
            dismissCompletionPrompt();
            recordFailure();
            Log.w(TAG, "Update completion prompt unavailable");
        }
    }

    private void completionFailed() {
        recordFailure();
        if (session.canRender()) Toast.makeText(activity, R.string.update_install_failed, Toast.LENGTH_LONG).show();
    }

    private void dismissCompletionPrompt() {
        if (completionDialog != null) completionDialog.dismiss();
        completionDialog = null;
    }
}
