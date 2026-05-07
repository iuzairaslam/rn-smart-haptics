package com.rnsmarthaptics

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import org.json.JSONArray
import org.json.JSONObject
import kotlin.math.ceil
import kotlin.math.min
import kotlin.math.roundToInt
import kotlin.math.sin

class RnSmartHapticsModule(reactContext: ReactApplicationContext) :
  NativeRnSmartHapticsSpec(reactContext) {

  private val vibrator: Vibrator?
    get() {
      return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        val vm =
          reactApplicationContext.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
        vm.defaultVibrator
      } else {
        @Suppress("DEPRECATION")
        reactApplicationContext.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
      }
    }

  private fun scaleAmplitude(intensity: Double): Int {
    val clamped = intensity.coerceIn(0.0, 1.0)
    return (40 + clamped * 215).roundToInt().coerceIn(1, 255)
  }

  private fun vibrateWaveform(
    timingsMs: LongArray,
    amplitudes: IntArray?,
    promise: Promise,
  ) {
    val v = vibrator
    if (v == null || !v.hasVibrator()) {
      promise.resolve(null)
      return
    }

    if (timingsMs.size > MAX_WAVEFORM_ENTRIES || (amplitudes != null && amplitudes.size != timingsMs.size)) {
      promise.reject("waveform_limit", "Vibration pattern exceeds native limits")
      return
    }

    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val effect =
          if (amplitudes != null) {
            VibrationEffect.createWaveform(timingsMs, amplitudes, -1)
          } else {
            VibrationEffect.createWaveform(timingsMs, -1)
          }
        v.vibrate(effect)
      } else {
        @Suppress("DEPRECATION")
        v.vibrate(timingsMs, -1)
      }
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("vibrate_error", e.message, e)
    }
  }

  private fun singlePulse(durationMs: Long, amplitude: Int, promise: Promise) {
    vibrateWaveform(longArrayOf(0, durationMs), intArrayOf(0, amplitude.coerceIn(1, 255)), promise)
  }

  override fun success(promise: Promise) {
    vibrateWaveform(
      longArrayOf(0, 28, 42, 48),
      intArrayOf(0, scaleAmplitude(0.55), 0, scaleAmplitude(0.95)),
      promise,
    )
  }

  override fun error(promise: Promise) {
    vibrateWaveform(
      longArrayOf(0, 36, 72, 108),
      intArrayOf(
        0,
        scaleAmplitude(0.35),
        scaleAmplitude(0.6),
        scaleAmplitude(1.0),
      ),
      promise,
    )
  }

  override fun warning(promise: Promise) {
    vibrateWaveform(
      longArrayOf(0, 55, 65, 120),
      intArrayOf(0, scaleAmplitude(0.72), 0, scaleAmplitude(0.88)),
      promise,
    )
  }

  override fun celebration(promise: Promise) {
    vibrateWaveform(
      longArrayOf(0, 35, 45, 38, 42, 35, 40),
      intArrayOf(
        0,
        scaleAmplitude(0.45),
        scaleAmplitude(0.58),
        scaleAmplitude(0.68),
        scaleAmplitude(0.78),
        scaleAmplitude(0.88),
        scaleAmplitude(1.0),
      ),
      promise,
    )
  }

  override fun lightImpact(promise: Promise) {
    singlePulse(22L, scaleAmplitude(0.42), promise)
  }

  override fun mediumImpact(promise: Promise) {
    singlePulse(30L, scaleAmplitude(0.68), promise)
  }

  override fun heavyImpact(promise: Promise) {
    singlePulse(42L, scaleAmplitude(1.0), promise)
  }

  override fun rigid(promise: Promise) {
    singlePulse(18L, scaleAmplitude(1.0), promise)
  }

  override fun soft(promise: Promise) {
    singlePulse(38L, scaleAmplitude(0.28), promise)
  }

  override fun selection(promise: Promise) {
    singlePulse(14L, scaleAmplitude(0.52), promise)
  }

  override fun doubleTap(promise: Promise) {
    vibrateWaveform(
      longArrayOf(0, 26, 48, 26),
      intArrayOf(0, scaleAmplitude(0.82), 0, scaleAmplitude(0.88)),
      promise,
    )
  }

  override fun tick(promise: Promise) {
    singlePulse(10L, scaleAmplitude(0.22), promise)
  }

  override fun playSequenceJson(sequenceJson: String, promise: Promise) {
    if (sequenceJson.length > MAX_JSON_CHARS) {
      promise.reject("payload_too_large", "sequence JSON exceeds maximum size")
      return
    }
    try {
      val arr = JSONArray(sequenceJson)
      if (arr.length() > MAX_SEQUENCE_STEPS) {
        promise.reject("sequence_limit", "Too many sequence steps")
        return
      }

      val timings = ArrayList<Long>()
      val amps = ArrayList<Int>()
      timings.add(0L)
      amps.add(0)

      var i = 0
      while (i < arr.length()) {
        val obj = arr.optJSONObject(i)
        if (obj != null) {
          when (obj.optString("type")) {
            "pause" -> {
              var ms = obj.optDouble("duration", 0.0)
              if (!ms.isUsable() || ms < 0) {
                ms = 0.0
              }
              ms = min(ms, MAX_PAUSE_MS.toDouble())
              val msLong = ms.toLong()
              if (msLong > 0) {
                timings.add(msLong)
                amps.add(0)
              }
            }
            "impact" -> {
              var intensity = obj.optDouble("intensity", 0.6)
              var sharpness = obj.optDouble("sharpness", 0.5)
              if (!intensity.isUsable()) intensity = 0.6
              if (!sharpness.isUsable()) sharpness = 0.5
              intensity = intensity.coerceIn(0.0, 1.0)
              sharpness = sharpness.coerceIn(0.0, 1.0)
              val dur = (18 + sharpness * 28).roundToInt().coerceIn(12, 55).toLong()
              timings.add(dur)
              amps.add(scaleAmplitude(intensity))
              timings.add(12)
              amps.add(0)
            }
          }
        }
        i++
        if (timings.size > MAX_WAVEFORM_ENTRIES) {
          promise.reject("waveform_limit", "Sequence expands to too many vibration segments")
          return
        }
      }

      if (timings.size <= 1) {
        promise.resolve(null)
        return
      }

      vibrateWaveform(timings.toLongArray(), amps.toIntArray(), promise)
    } catch (e: Exception) {
      promise.reject("sequence_parse", e.message, e)
    }
  }

  override fun rhythmJson(configJson: String, promise: Promise) {
    if (configJson.length > MAX_JSON_CHARS) {
      promise.reject("payload_too_large", "rhythm JSON exceeds maximum size")
      return
    }
    try {
      val cfg = JSONObject(configJson)
      val patternArr =
        cfg.optJSONArray("pattern") ?: run {
          promise.reject("invalid_config", "pattern required")
          return
        }

      if (patternArr.length() == 0 || patternArr.length() > MAX_PATTERN_LENGTH) {
        promise.reject("invalid_config", "pattern length out of range")
        return
      }

      var bpm = cfg.optDouble("bpm", 0.0)
      var durationMs = cfg.optDouble("duration", 0.0)
      if (!bpm.isUsable() || !durationMs.isUsable()) {
        promise.reject("invalid_config", "bpm and duration must be finite numbers")
        return
      }

      if (bpm < MIN_BPM || bpm > MAX_BPM || durationMs <= 0 || durationMs > MAX_RHYTHM_MS) {
        promise.reject("invalid_config", "bpm or duration out of supported range")
        return
      }

      val beatMs = 60000.0 / bpm
      if (!beatMs.isUsable() || beatMs <= 0) {
        promise.reject("invalid_config", "invalid beat interval")
        return
      }

      val estimatedBeats = ceil(durationMs / beatMs).toInt()
      if (estimatedBeats > MAX_RHYTHM_BEATS) {
        promise.reject("rhythm_too_dense", "Rhythm exceeds maximum pulse count")
        return
      }

      val timings = ArrayList<Long>()
      val amps = ArrayList<Int>()
      timings.add(0L)
      amps.add(0)

      var t = 0.0
      var idx = 0
      while (t < durationMs && idx < MAX_RHYTHM_BEATS) {
        val pulse = patternArr.optDouble(idx % patternArr.length(), 0.0) != 0.0
        if (pulse) {
          val intensity = min(1.0, 0.45 + 0.55 * sin(idx * 0.35))
          timings.add(22)
          amps.add(scaleAmplitude(intensity))
          val rest = (beatMs - 22).coerceAtLeast(4.0).toLong()
          timings.add(rest)
          amps.add(0)
        } else {
          timings.add(beatMs.coerceAtLeast(4.0).toLong())
          amps.add(0)
        }
        t += beatMs
        idx++
        if (timings.size > MAX_WAVEFORM_ENTRIES) {
          promise.reject("waveform_limit", "Rhythm expands to too many vibration segments")
          return
        }
      }

      if (timings.size <= 1) {
        promise.resolve(null)
        return
      }

      vibrateWaveform(timings.toLongArray(), amps.toIntArray(), promise)
    } catch (e: Exception) {
      promise.reject("rhythm_parse", e.message, e)
    }
  }

  private fun Double.isUsable(): Boolean = !(isNaN() || isInfinite())

  companion object {
    const val NAME = NativeRnSmartHapticsSpec.NAME

    private const val MAX_JSON_CHARS = 65536
    private const val MAX_SEQUENCE_STEPS = 256
    private const val MAX_PAUSE_MS = 30_000L
    private const val MAX_RHYTHM_MS = 120_000.0
    private const val MIN_BPM = 20.0
    private const val MAX_BPM = 480.0
    private const val MAX_PATTERN_LENGTH = 64
    private const val MAX_RHYTHM_BEATS = 25_000
    private const val MAX_WAVEFORM_ENTRIES = 4096
  }
}
