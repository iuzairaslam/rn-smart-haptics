package com.rnsmarthaptics

import com.facebook.react.bridge.ReactApplicationContext

class RnSmartHapticsModule(reactContext: ReactApplicationContext) :
  NativeRnSmartHapticsSpec(reactContext) {

  override fun multiply(a: Double, b: Double): Double {
    return a * b
  }

  companion object {
    const val NAME = NativeRnSmartHapticsSpec.NAME
  }
}
