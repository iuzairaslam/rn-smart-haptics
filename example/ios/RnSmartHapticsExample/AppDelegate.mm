#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import <TargetConditionals.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"RnSmartHapticsExample";
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

- (NSURL *)bundleURL
{
#if DEBUG
  RCTBundleURLProvider *settings = [RCTBundleURLProvider sharedSettings];
  NSURL *url = [settings jsBundleURLForBundleRoot:@"index"];
  if (url != nil) {
    return url;
  }
  // When Metro is not running, -jsBundleURLForBundleRoot: falls back to a missing
  // main.jsbundle and returns nil, which surfaces as "No script URL provided".
  // Pin the simulator to the default packager so the app always has a valid URL;
  // Metro can still be started afterwards and Reload (⌘R) will work.
  NSString *hostPort = nil;
#if TARGET_OS_SIMULATOR
  hostPort =
      [NSString stringWithFormat:@"127.0.0.1:%lu", (unsigned long)kRCTBundleURLProviderDefaultPort];
#else
  if (settings.jsLocation.length > 0) {
    hostPort = settings.jsLocation;
  }
#endif
  if (hostPort == nil) {
    return nil;
  }
  return [RCTBundleURLProvider jsBundleURLForBundleRoot:@"index"
                                           packagerHost:hostPort
                                         packagerScheme:nil
                                              enableDev:YES
                                     enableMinification:NO
                                        inlineSourceMap:NO
                                            modulesOnly:NO
                                              runModule:YES
                                    additionalOptions:nil];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

@end
