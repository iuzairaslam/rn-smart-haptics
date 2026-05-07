package com.rnsmarthaptics

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class RnSmartHapticsPackage : BaseReactPackage() {
  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
    return if (name == RnSmartHapticsModule.NAME) {
      RnSmartHapticsModule(reactContext)
    } else {
      null
    }
  }

  override fun getReactModuleInfoProvider() = ReactModuleInfoProvider {
    mapOf(
      RnSmartHapticsModule.NAME to ReactModuleInfo(
        RnSmartHapticsModule.NAME,
        RnSmartHapticsModule::class.java.name,
        false,
        false,
        false,
        true,
      )
    )
  }
}
