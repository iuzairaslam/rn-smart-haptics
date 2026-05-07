#import "RnSmartHaptics.h"

#import <CoreHaptics/CoreHaptics.h>
#import <math.h>
#import <UIKit/UIKit.h>

static const NSUInteger kRSHMaxSequenceSteps = 256;
static const NSUInteger kRSHMaxJsonChars = 65536;
static const double kRSHMaxPauseSeconds = 30.0;
static const double kRSHMaxRhythmDurationMs = 120000.0;
static const double kRSHMinBpm = 20.0;
static const double kRSHMaxBpm = 480.0;
static const NSUInteger kRSHMaxPatternLength = 64;
static const NSUInteger kRSHMaxRhythmBeats = 25000;
static const NSUInteger kRSHMaxFallbackDispatches = 200;

static BOOL RSHIsFiniteDouble(double v)
{
  return isfinite(v);
}

static double RSHPauseSecondsFromMillis(NSNumber *_Nullable dur)
{
  if (dur == nil || ![dur isKindOfClass:[NSNumber class]]) {
    return 0;
  }
  double s = [dur doubleValue] / 1000.0;
  if (!RSHIsFiniteDouble(s) || s < 0) {
    return 0;
  }
  return fmin(s, kRSHMaxPauseSeconds);
}

@implementation RnSmartHaptics {
  CHHapticEngine *_Nullable _engine API_AVAILABLE(ios(13.0));
}

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

static BOOL RSHSupportsCoreHaptics(void)
{
  if (@available(iOS 13.0, *)) {
    return CHHapticEngine.capabilitiesForHardware.supportsHaptics;
  }
  return NO;
}

API_AVAILABLE(ios(13.0))
static CHHapticEvent *RSHTransient(double time, float intensity, float sharpness)
{
  intensity = (float)fmax(0.0, fmin(1.0, intensity));
  sharpness = (float)fmax(0.0, fmin(1.0, sharpness));
  CHHapticEventParameter *pi =
      [[CHHapticEventParameter alloc] initWithParameterID:CHHapticEventParameterIDHapticIntensity value:intensity];
  CHHapticEventParameter *ps =
      [[CHHapticEventParameter alloc] initWithParameterID:CHHapticEventParameterIDHapticSharpness value:sharpness];
  return [[CHHapticEvent alloc] initWithEventType:CHHapticEventTypeHapticTransient
                                       parameters:@[ pi, ps ]
                                      relativeTime:time];
}

- (BOOL)rsh_playEvents:(NSArray<CHHapticEvent *> *)events error:(NSError **)outError API_AVAILABLE(ios(13.0))
{
  if (_engine == nil) {
    _engine = [[CHHapticEngine alloc] initAndReturnError:outError];
    if (_engine == nil) {
      return NO;
    }
    __weak RnSmartHaptics *weakSelf = self;
    [_engine setResetHandler:^{
      RnSmartHaptics *strong = weakSelf;
      if (strong != nil && strong->_engine != nil) {
        NSError *err = nil;
        [strong->_engine startAndReturnError:&err];
      }
    }];
  }

  if (![_engine startAndReturnError:outError]) {
    return NO;
  }

  CHHapticPattern *pattern = [[CHHapticPattern alloc] initWithEvents:events parameters:@[] error:outError];
  if (pattern == nil) {
    return NO;
  }

  id<CHHapticPatternPlayer> player = [_engine createPlayerWithPattern:pattern error:outError];
  if (player == nil) {
    return NO;
  }

  return [player startAtTime:0 error:outError];
}

- (void)rsh_fallbackNotification:(UINotificationFeedbackType)type API_AVAILABLE(ios(10.0))
{
  UINotificationFeedbackGenerator *gen = [[UINotificationFeedbackGenerator alloc] init];
  [gen notificationOccurred:type];
}

- (void)rsh_fallbackImpact:(UIImpactFeedbackStyle)style intensity:(CGFloat)intensity API_AVAILABLE(ios(13.0))
{
  UIImpactFeedbackGenerator *gen = [[UIImpactFeedbackGenerator alloc] initWithStyle:style];
  [gen impactOccurredWithIntensity:intensity];
}

- (void)rsh_fallbackSelection API_AVAILABLE(ios(10.0))
{
  UISelectionFeedbackGenerator *gen = [[UISelectionFeedbackGenerator alloc] init];
  [gen selectionChanged];
}

- (void)success:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  dispatch_async(dispatch_get_main_queue(), ^{
    if (@available(iOS 13.0, *)) {
      if (RSHSupportsCoreHaptics()) {
        NSError *err = nil;
        NSArray *events = @[ RSHTransient(0, 1.0f, 0.85f) ];
        if ([self rsh_playEvents:events error:&err]) {
          resolve(nil);
          return;
        }
      }
      [self rsh_fallbackNotification:UINotificationFeedbackTypeSuccess];
    }
    resolve(nil);
  });
}

- (void)error:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  dispatch_async(dispatch_get_main_queue(), ^{
    if (@available(iOS 13.0, *)) {
      if (RSHSupportsCoreHaptics()) {
        NSError *err = nil;
        NSArray *events = @[
          RSHTransient(0, 0.35f, 0.9f),
          RSHTransient(0.11, 0.65f, 0.75f),
          RSHTransient(0.22, 1.0f, 0.55f),
        ];
        if ([self rsh_playEvents:events error:&err]) {
          resolve(nil);
          return;
        }
      }
      UIImpactFeedbackGenerator *g = [[UIImpactFeedbackGenerator alloc] initWithStyle:UIImpactFeedbackStyleHeavy];
      [g impactOccurred];
      dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.09 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
        [g impactOccurred];
      });
      dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.18 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
        [g impactOccurred];
      });
    }
    resolve(nil);
  });
}

- (void)warning:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  dispatch_async(dispatch_get_main_queue(), ^{
    if (@available(iOS 13.0, *)) {
      if (RSHSupportsCoreHaptics()) {
        NSError *err = nil;
        NSArray *events = @[ RSHTransient(0, 0.75f, 0.45f), RSHTransient(0.09, 0.95f, 0.35f) ];
        if ([self rsh_playEvents:events error:&err]) {
          resolve(nil);
          return;
        }
      }
      [self rsh_fallbackNotification:UINotificationFeedbackTypeWarning];
    }
    resolve(nil);
  });
}

- (void)celebration:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  dispatch_async(dispatch_get_main_queue(), ^{
    if (@available(iOS 13.0, *)) {
      if (RSHSupportsCoreHaptics()) {
        NSError *err = nil;
        NSArray *events = @[
          RSHTransient(0.00, 0.55f, 0.75f),
          RSHTransient(0.06, 0.72f, 0.68f),
          RSHTransient(0.11, 0.84f, 0.58f),
          RSHTransient(0.15, 0.93f, 0.48f),
          RSHTransient(0.18, 1.00f, 0.40f),
        ];
        if ([self rsh_playEvents:events error:&err]) {
          resolve(nil);
          return;
        }
      }
      for (NSInteger i = 0; i < 5; i++) {
        dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(i * 0.055 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
          [self rsh_fallbackImpact:UIImpactFeedbackStyleLight intensity:(CGFloat)(0.55 + i * 0.09)];
        });
      }
    }
    resolve(nil);
  });
}

- (void)lightImpact:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  dispatch_async(dispatch_get_main_queue(), ^{
    if (@available(iOS 13.0, *)) {
      if (RSHSupportsCoreHaptics()) {
        NSError *err = nil;
        NSArray *events = @[ RSHTransient(0, 0.38f, 0.52f) ];
        if ([self rsh_playEvents:events error:&err]) {
          resolve(nil);
          return;
        }
      }
      [self rsh_fallbackImpact:UIImpactFeedbackStyleLight intensity:0.55];
    }
    resolve(nil);
  });
}

- (void)mediumImpact:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  dispatch_async(dispatch_get_main_queue(), ^{
    if (@available(iOS 13.0, *)) {
      if (RSHSupportsCoreHaptics()) {
        NSError *err = nil;
        NSArray *events = @[ RSHTransient(0, 0.68f, 0.55f) ];
        if ([self rsh_playEvents:events error:&err]) {
          resolve(nil);
          return;
        }
      }
      [self rsh_fallbackImpact:UIImpactFeedbackStyleMedium intensity:0.72];
    }
    resolve(nil);
  });
}

- (void)heavyImpact:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  dispatch_async(dispatch_get_main_queue(), ^{
    if (@available(iOS 13.0, *)) {
      if (RSHSupportsCoreHaptics()) {
        NSError *err = nil;
        NSArray *events = @[ RSHTransient(0, 1.0f, 0.42f) ];
        if ([self rsh_playEvents:events error:&err]) {
          resolve(nil);
          return;
        }
      }
      [self rsh_fallbackImpact:UIImpactFeedbackStyleHeavy intensity:0.95];
    }
    resolve(nil);
  });
}

- (void)rigid:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  dispatch_async(dispatch_get_main_queue(), ^{
    if (@available(iOS 13.0, *)) {
      if (RSHSupportsCoreHaptics()) {
        NSError *err = nil;
        NSArray *events = @[ RSHTransient(0, 0.98f, 1.0f) ];
        if ([self rsh_playEvents:events error:&err]) {
          resolve(nil);
          return;
        }
      }
      [self rsh_fallbackImpact:UIImpactFeedbackStyleRigid intensity:1.0];
    }
    resolve(nil);
  });
}

- (void)soft:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  dispatch_async(dispatch_get_main_queue(), ^{
    if (@available(iOS 13.0, *)) {
      if (RSHSupportsCoreHaptics()) {
        NSError *err = nil;
        NSArray *events = @[ RSHTransient(0, 0.28f, 0.22f) ];
        if ([self rsh_playEvents:events error:&err]) {
          resolve(nil);
          return;
        }
      }
      [self rsh_fallbackImpact:UIImpactFeedbackStyleSoft intensity:0.65];
    }
    resolve(nil);
  });
}

- (void)selection:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  dispatch_async(dispatch_get_main_queue(), ^{
    if (@available(iOS 13.0, *)) {
      if (RSHSupportsCoreHaptics()) {
        NSError *err = nil;
        NSArray *events = @[ RSHTransient(0, 0.52f, 0.92f) ];
        if ([self rsh_playEvents:events error:&err]) {
          resolve(nil);
          return;
        }
      }
      [self rsh_fallbackSelection];
    }
    resolve(nil);
  });
}

- (void)doubleTap:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  dispatch_async(dispatch_get_main_queue(), ^{
    if (@available(iOS 13.0, *)) {
      if (RSHSupportsCoreHaptics()) {
        NSError *err = nil;
        NSArray *events = @[ RSHTransient(0, 0.82f, 0.62f), RSHTransient(0.055, 0.88f, 0.58f) ];
        if ([self rsh_playEvents:events error:&err]) {
          resolve(nil);
          return;
        }
      }
      [self rsh_fallbackImpact:UIImpactFeedbackStyleMedium intensity:0.85];
      dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.06 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
        [self rsh_fallbackImpact:UIImpactFeedbackStyleMedium intensity:0.85];
      });
    }
    resolve(nil);
  });
}

- (void)tick:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  dispatch_async(dispatch_get_main_queue(), ^{
    if (@available(iOS 13.0, *)) {
      if (RSHSupportsCoreHaptics()) {
        NSError *err = nil;
        NSArray *events = @[ RSHTransient(0, 0.22f, 1.0f) ];
        if ([self rsh_playEvents:events error:&err]) {
          resolve(nil);
          return;
        }
      }
      [self rsh_fallbackImpact:UIImpactFeedbackStyleLight intensity:0.45];
    }
    resolve(nil);
  });
}

- (void)playSequenceJson:(NSString *)sequenceJson
                resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject
{
  if (sequenceJson.length > kRSHMaxJsonChars) {
    reject(@"payload_too_large", @"sequence JSON exceeds maximum size", nil);
    return;
  }

  NSData *data = [sequenceJson dataUsingEncoding:NSUTF8StringEncoding];
  if (data == nil) {
    reject(@"invalid_json", @"sequenceJson encoding failed", nil);
    return;
  }

  NSError *jsonError = nil;
  id parsed = [NSJSONSerialization JSONObjectWithData:data options:0 error:&jsonError];
  if (![parsed isKindOfClass:[NSArray class]]) {
    reject(@"invalid_json", @"sequenceJson must be a JSON array", jsonError);
    return;
  }

  NSArray *steps = (NSArray *)parsed;
  if (steps.count > kRSHMaxSequenceSteps) {
    reject(@"sequence_limit", @"Too many sequence steps", nil);
    return;
  }

  dispatch_async(dispatch_get_main_queue(), ^{
    if (@available(iOS 13.0, *)) {
      if (RSHSupportsCoreHaptics()) {
        double t = 0;
        NSMutableArray<CHHapticEvent *> *events = [NSMutableArray array];
        for (NSDictionary *item in steps) {
          if (![item isKindOfClass:[NSDictionary class]]) {
            continue;
          }
          NSString *type = item[@"type"];
          if ([type isEqualToString:@"pause"]) {
            t += RSHPauseSecondsFromMillis(item[@"duration"]);
          } else if ([type isEqualToString:@"impact"]) {
            double ri = [item[@"intensity"] doubleValue];
            double rs = [item[@"sharpness"] doubleValue];
            if (!RSHIsFiniteDouble(ri)) {
              ri = 0.6;
            }
            if (!RSHIsFiniteDouble(rs)) {
              rs = 0.5;
            }
            float intensity = (float)ri;
            float sharpness = (float)rs;
            [events addObject:RSHTransient(t, intensity, sharpness)];
          }
        }

        NSError *err = nil;
        if (events.count > 0 && [self rsh_playEvents:events error:&err]) {
          resolve(nil);
          return;
        }
      }

      NSUInteger fallbackScheduled = 0;
      double timeline = 0;
      for (NSDictionary *item in steps) {
        if (![item isKindOfClass:[NSDictionary class]]) {
          continue;
        }
        NSString *type = item[@"type"];
        if ([type isEqualToString:@"pause"]) {
          timeline += RSHPauseSecondsFromMillis(item[@"duration"]);
        } else if ([type isEqualToString:@"impact"]) {
          if (fallbackScheduled >= kRSHMaxFallbackDispatches) {
            continue;
          }
          double fireAt = timeline;
          double ri = [item[@"intensity"] doubleValue];
          if (!RSHIsFiniteDouble(ri)) {
            ri = 0.6;
          }
          float intensity = (float)fmax(0.1, fmin(1.0, ri));
          fallbackScheduled++;
          dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(fireAt * NSEC_PER_SEC)),
                         dispatch_get_main_queue(),
                         ^{
                           UIImpactFeedbackGenerator *g =
                               [[UIImpactFeedbackGenerator alloc] initWithStyle:UIImpactFeedbackStyleMedium];
                           [g impactOccurredWithIntensity:intensity];
                         });
        }
      }
    }
    resolve(nil);
  });
}

- (void)rhythmJson:(NSString *)configJson
           resolve:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject
{
  if (configJson.length > kRSHMaxJsonChars) {
    reject(@"payload_too_large", @"rhythm JSON exceeds maximum size", nil);
    return;
  }

  NSData *data = [configJson dataUsingEncoding:NSUTF8StringEncoding];
  if (data == nil) {
    reject(@"invalid_json", @"configJson encoding failed", nil);
    return;
  }

  NSError *jsonError = nil;
  id parsed = [NSJSONSerialization JSONObjectWithData:data options:0 error:&jsonError];
  if (![parsed isKindOfClass:[NSDictionary class]]) {
    reject(@"invalid_json", @"rhythmJson must be a JSON object", jsonError);
    return;
  }
  NSDictionary *cfg = (NSDictionary *)parsed;
  NSNumber *durationMsNum = cfg[@"duration"];
  NSArray *pattern = cfg[@"pattern"];
  double bpm = [cfg[@"bpm"] doubleValue];

  if (![pattern isKindOfClass:[NSArray class]] || pattern.count == 0 || durationMsNum == nil) {
    reject(@"invalid_config", @"bpm, duration, and non-empty pattern are required", nil);
    return;
  }

  if (pattern.count > kRSHMaxPatternLength) {
    reject(@"invalid_config", @"pattern length out of range", nil);
    return;
  }

  double durationMs = [durationMsNum doubleValue];
  if (!RSHIsFiniteDouble(bpm) || !RSHIsFiniteDouble(durationMs)) {
    reject(@"invalid_config", @"bpm and duration must be finite numbers", nil);
    return;
  }

  if (bpm < kRSHMinBpm || bpm > kRSHMaxBpm || durationMs <= 0 || durationMs > kRSHMaxRhythmDurationMs) {
    reject(@"invalid_config", @"bpm or duration out of supported range", nil);
    return;
  }

  double beatMs = 60000.0 / bpm;
  if (!RSHIsFiniteDouble(beatMs) || beatMs <= 0) {
    reject(@"invalid_config", @"invalid beat interval", nil);
    return;
  }

  double estimatedBeats = ceil(durationMs / beatMs);
  if (estimatedBeats > kRSHMaxRhythmBeats) {
    reject(@"rhythm_too_dense", @"Rhythm exceeds maximum pulse count", nil);
    return;
  }

  dispatch_async(dispatch_get_main_queue(), ^{
    if (@available(iOS 13.0, *)) {
      if (RSHSupportsCoreHaptics()) {
        NSMutableArray<CHHapticEvent *> *events = [NSMutableArray array];
        double t = 0;
        NSUInteger i = 0;
        while (t < durationMs && i < kRSHMaxRhythmBeats) {
          id step = pattern[i % pattern.count];
          if ([step respondsToSelector:@selector(doubleValue)] && [step doubleValue] != 0) {
            float intensity = (float)fmin(1.0, 0.45 + 0.55 * sin((double)i * 0.35));
            [events addObject:RSHTransient(t / 1000.0, intensity, 0.55f)];
          }
          t += beatMs;
          i++;
        }

        NSError *err = nil;
        if (events.count > 0 && [self rsh_playEvents:events error:&err]) {
          resolve(nil);
          return;
        }
      }

      NSUInteger fallbackScheduled = 0;
      double t2 = 0;
      NSUInteger j = 0;
      while (t2 < durationMs && j < kRSHMaxRhythmBeats) {
        id step = pattern[j % pattern.count];
        if ([step respondsToSelector:@selector(doubleValue)] && [step doubleValue] != 0) {
          if (fallbackScheduled < kRSHMaxFallbackDispatches) {
            double fireAt = t2 / 1000.0;
            fallbackScheduled++;
            dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(fireAt * NSEC_PER_SEC)),
                           dispatch_get_main_queue(),
                           ^{
                             [self rsh_fallbackImpact:UIImpactFeedbackStyleLight intensity:0.55];
                           });
          }
        }
        t2 += beatMs;
        j++;
      }
    }
    resolve(nil);
  });
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeRnSmartHapticsSpecJSI>(params);
}

+ (NSString *)moduleName
{
  return @"RnSmartHaptics";
}

@end
