package com.world.revolution;

import android.os.Looper;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.speech.tts.Voice;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@CapacitorPlugin(name = "WRNTts")
public class WRNTtsPlugin extends Plugin {
    private static final int MAX_CHUNKS = 256;
    private static final int MAX_CHUNK_CHARACTERS = 1_200;

    private TextToSpeech engine;
    private boolean ready;
    private List<String> chunks = List.of();
    private int chunkIndex;
    private String requestId;
    private boolean paused;
    private long playbackEpoch;
    private String activeUtteranceId;
    private long lifecycleEpoch;
    private boolean destroyed;

    @Override
    public void load() {
        super.load();
        getActivity().runOnUiThread(() -> {
            destroyed = false;
            final long initEpoch = ++lifecycleEpoch;
            final TextToSpeech[] created = new TextToSpeech[1];
            created[0] = new TextToSpeech(getContext(), status -> {
                TextToSpeech initialized = created[0];
                if (destroyed || initEpoch != lifecycleEpoch || initialized == null || engine != initialized) return;
                ready = status == TextToSpeech.SUCCESS;
                if (ready) {
                    initialized.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                        @Override public void onStart(String utteranceId) {}
                        @Override public void onDone(String utteranceId) { onUtteranceFinished(utteranceId, false); }
                        @Override public void onError(String utteranceId) { onUtteranceFinished(utteranceId, true); }
                        @Override public void onStop(String utteranceId, boolean interrupted) {}
                    });
                    notifyListeners("ttsVoicesChanged", new JSObject());
                }
            });
            engine = created[0];
        });
    }

    @PluginMethod
    public void getVoices(PluginCall call) {
        onMain(() -> {
            JSArray result = new JSArray();
            if (ready && engine != null) {
                List<Voice> voices = new ArrayList<>(engine.getVoices());
                voices.sort(Comparator.comparing(Voice::getName));
                for (Voice voice : voices) {
                    if (voice.isNetworkConnectionRequired()) continue;
                    JSObject item = new JSObject();
                    item.put("id", voice.getName());
                    item.put("name", voice.getName());
                    item.put("language", voice.getLocale().toLanguageTag());
                    result.put(item);
                }
            }
            JSObject response = new JSObject();
            response.put("voices", result);
            call.resolve(response);
        });
    }

    @PluginMethod
    public void speak(PluginCall call) {
        onMain(() -> {
            if (!ready || engine == null) {
                call.reject("Local Android speech is unavailable.");
                return;
            }
            String nextRequestId = call.getString("requestId");
            String voiceId = call.getString("voiceId");
            JSArray inputChunks = call.getArray("chunks");
            Double requestedRate = call.getDouble("rate");
            if (nextRequestId == null || !nextRequestId.matches("[1-9][0-9]{0,15}") ||
                voiceId == null || voiceId.length() > 256 || inputChunks == null ||
                inputChunks.length() == 0 || inputChunks.length() > MAX_CHUNKS ||
                requestedRate == null || !Double.isFinite(requestedRate) ||
                requestedRate < 0.5 || requestedRate > 2.0) {
                call.reject("Invalid local speech request.");
                return;
            }
            Voice selected = offlineVoices().stream()
                .filter(voice -> voice.getName().equals(voiceId))
                .findFirst().orElse(null);
            if (selected == null) {
                call.reject("Selected local voice is unavailable.");
                return;
            }
            List<String> nextChunks = new ArrayList<>();
            for (int index = 0; index < inputChunks.length(); index++) {
                String chunk;
                try { chunk = inputChunks.getString(index); }
                catch (Exception exception) { call.reject("Invalid local speech text."); return; }
                if (chunk == null || chunk.isBlank() || chunk.codePointCount(0, chunk.length()) > MAX_CHUNK_CHARACTERS) {
                    call.reject("Invalid local speech text.");
                    return;
                }
                nextChunks.add(chunk);
            }
            stopInternal();
            int voiceResult = engine.setVoice(selected);
            Voice activeVoice = engine.getVoice();
            int rateResult = engine.setSpeechRate(requestedRate.floatValue());
            if (voiceResult == TextToSpeech.ERROR || rateResult == TextToSpeech.ERROR ||
                activeVoice == null || !activeVoice.getName().equals(selected.getName()) ||
                activeVoice.isNetworkConnectionRequired()) {
                engine.stop();
                call.reject("Selected offline voice could not be activated.");
                return;
            }
            chunks = List.copyOf(nextChunks);
            chunkIndex = 0;
            requestId = nextRequestId;
            paused = false;
            speakCurrent();
            call.resolve();
        });
    }

    @PluginMethod public void pause(PluginCall call) {
        onMain(() -> {
            if (requestId != null && !paused && engine != null) {
                paused = true;
                playbackEpoch += 1;
                activeUtteranceId = null;
                engine.stop();
            }
            call.resolve();
        });
    }

    @PluginMethod public void resume(PluginCall call) {
        onMain(() -> {
            if (requestId != null && paused) {
                paused = false;
                speakCurrent();
            }
            call.resolve();
        });
    }

    @PluginMethod public void stop(PluginCall call) {
        onMain(() -> { stopInternal(); call.resolve(); });
    }

    private Set<Voice> offlineVoices() {
        Set<Voice> voices = engine == null ? null : engine.getVoices();
        if (voices == null) return Set.of();
        Set<Voice> offline = new HashSet<>();
        for (Voice voice : voices) if (!voice.isNetworkConnectionRequired()) offline.add(voice);
        return offline;
    }

    private void speakCurrent() {
        if (engine == null || requestId == null || paused) return;
        if (chunkIndex >= chunks.size()) {
            String completed = requestId;
            clearCurrent();
            notifyState(completed, "finished");
            return;
        }
        String utteranceId = requestId + ":" + chunkIndex + ":" + (++playbackEpoch);
        activeUtteranceId = utteranceId;
        int result = engine.speak(
            chunks.get(chunkIndex), TextToSpeech.QUEUE_FLUSH, (android.os.Bundle) null, utteranceId
        );
        if (result == TextToSpeech.ERROR) {
            String failed = requestId;
            clearCurrent();
            notifyState(failed, "error");
        }
    }

    private void onUtteranceFinished(String utteranceId, boolean failed) {
        onMain(() -> {
            if (requestId == null || paused || !utteranceId.equals(activeUtteranceId)) return;
            activeUtteranceId = null;
            if (failed) {
                String failedRequest = requestId;
                clearCurrent();
                notifyState(failedRequest, "error");
                return;
            }
            chunkIndex += 1;
            speakCurrent();
        });
    }

    private void notifyState(String completedRequestId, String status) {
        JSObject event = new JSObject();
        event.put("requestId", completedRequestId);
        event.put("status", status);
        notifyListeners("ttsState", event);
    }

    private void stopInternal() {
        if (engine != null) engine.stop();
        clearCurrent();
    }

    private void clearCurrent() {
        playbackEpoch += 1;
        chunks = List.of();
        chunkIndex = 0;
        requestId = null;
        paused = false;
        activeUtteranceId = null;
    }

    private void onMain(Runnable action) {
        if (Looper.myLooper() == Looper.getMainLooper()) action.run();
        else getActivity().runOnUiThread(action);
    }

    @Override
    protected void handleOnDestroy() {
        onMain(() -> {
            destroyed = true;
            lifecycleEpoch += 1;
            stopInternal();
            TextToSpeech retiring = engine;
            engine = null;
            ready = false;
            if (retiring != null) retiring.shutdown();
        });
    }
}
