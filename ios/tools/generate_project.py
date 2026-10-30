"""Generate the dependency-free Xcode project; safe to run on Windows or macOS."""
from hashlib import sha1
from pathlib import Path

root = Path(__file__).resolve().parents[1]
project = root / "Household.xcodeproj"
project.mkdir(exist_ok=True)

def uid(name):
    return sha1(name.encode()).hexdigest()[:24].upper()

def ref(name):
    return f"{uid(name)} /* {name} */"

objects = []
def obj(name, body):
    objects.append(f"\t\t{ref(name)} = {{ {body} }};")

sources = sorted((root / "Household").glob("*.swift"))
for path in sources:
    obj(path.name, f'isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = "{path.name}"; sourceTree = "<group>";')
    obj(path.name + " in Sources", f"isa = PBXBuildFile; fileRef = {ref(path.name)};")
for name, filetype in [("Info.plist", "text.plist.xml"), ("Household.entitlements", "text.plist.entitlements"), ("PrivacyInfo.xcprivacy", "text.xml")]:
    obj(name, f'isa = PBXFileReference; lastKnownFileType = {filetype}; path = "{name}"; sourceTree = "<group>";')
obj("Config.xcconfig", 'isa = PBXFileReference; lastKnownFileType = text.xcconfig; path = Config.xcconfig; sourceTree = "<group>";')
obj("Privacy in Resources", f"isa = PBXBuildFile; fileRef = {ref('PrivacyInfo.xcprivacy')};")
obj("Assets.xcassets", 'isa = PBXFileReference; lastKnownFileType = folder.assetcatalog; path = Assets.xcassets; sourceTree = "<group>";')
obj("Assets in Resources", f"isa = PBXBuildFile; fileRef = {ref('Assets.xcassets')};")
obj("Household.app", 'isa = PBXFileReference; explicitFileType = wrapper.application; includeInIndex = 0; path = Household.app; sourceTree = BUILT_PRODUCTS_DIR;')
children = ", ".join(ref(p.name) for p in sources)
children += ", " + ", ".join(ref(n) for n in ["Info.plist", "Household.entitlements", "PrivacyInfo.xcprivacy", "Assets.xcassets"])
obj("App Sources", f'isa = PBXGroup; children = ({children},); path = Household; sourceTree = "<group>";')
obj("Products", f'isa = PBXGroup; children = ({ref("Household.app")},); name = Products; sourceTree = "<group>";')
obj("Main Group", f'isa = PBXGroup; children = ({ref("App Sources")}, {ref("Config.xcconfig")}, {ref("Products")},); sourceTree = "<group>";')
obj("Sources", "isa = PBXSourcesBuildPhase; buildActionMask = 2147483647; files = (" + ", ".join(ref(p.name + " in Sources") for p in sources) + ",); runOnlyForDeploymentPostprocessing = 0;")
obj("Frameworks", "isa = PBXFrameworksBuildPhase; buildActionMask = 2147483647; files = (); runOnlyForDeploymentPostprocessing = 0;")
obj("Resources", f"isa = PBXResourcesBuildPhase; buildActionMask = 2147483647; files = ({ref('Privacy in Resources')}, {ref('Assets in Resources')},); runOnlyForDeploymentPostprocessing = 0;")

for mode in ["Debug", "Release"]:
    obj("Project " + mode, f'''isa = XCBuildConfiguration; buildSettings = {{
        SDKROOT = iphoneos; IPHONEOS_DEPLOYMENT_TARGET = 17.0;
        CLANG_ENABLE_MODULES = YES; CLANG_ENABLE_OBJC_ARC = YES;
        SWIFT_VERSION = 5.0;
        SWIFT_OPTIMIZATION_LEVEL = "{'-Onone' if mode == 'Debug' else '-O'}";
        DEBUG_INFORMATION_FORMAT = "{'dwarf' if mode == 'Debug' else 'dwarf-with-dsym'}";
        SWIFT_ACTIVE_COMPILATION_CONDITIONS = "{'DEBUG' if mode == 'Debug' else ''}";
    }}; name = {mode};''')
    obj("Target " + mode, f'''isa = XCBuildConfiguration; baseConfigurationReference = {ref('Config.xcconfig')}; buildSettings = {{
        PRODUCT_NAME = "$(TARGET_NAME)"; PRODUCT_MODULE_NAME = Household;
        INFOPLIST_FILE = Household/Info.plist; GENERATE_INFOPLIST_FILE = NO;
        CODE_SIGN_ENTITLEMENTS = Household/Household.entitlements;
        CODE_SIGN_STYLE = Automatic; TARGETED_DEVICE_FAMILY = 1;
        SUPPORTED_PLATFORMS = "iphoneos iphonesimulator";
        SUPPORTS_MACCATALYST = NO;
        LD_RUNPATH_SEARCH_PATHS = "$(inherited) @executable_path/Frameworks";
        ENABLE_PREVIEWS = YES;
        ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;
    }}; name = {mode};''')
for kind in ["Project", "Target"]:
    obj(kind + " Configurations", f'isa = XCConfigurationList; buildConfigurations = ({ref(kind + " Debug")}, {ref(kind + " Release")},); defaultConfigurationIsVisible = 0; defaultConfigurationName = Release;')
obj("Household Target", f'''isa = PBXNativeTarget; buildConfigurationList = {ref('Target Configurations')};
    buildPhases = ({ref('Sources')}, {ref('Frameworks')}, {ref('Resources')},);
    buildRules = (); dependencies = (); name = Household; productName = Household;
    productReference = {ref('Household.app')}; productType = "com.apple.product-type.application";''')
obj("Project", f'''isa = PBXProject; attributes = {{ LastUpgradeCheck = 1600; }};
    buildConfigurationList = {ref('Project Configurations')}; compatibilityVersion = "Xcode 14.0";
    developmentRegion = de; hasScannedForEncodings = 0; knownRegions = (de, en, Base,);
    mainGroup = {ref('Main Group')}; productRefGroup = {ref('Products')};
    projectDirPath = ""; projectRoot = ""; targets = ({ref('Household Target')},);''')
(project / "project.pbxproj").write_text("// !$*UTF8*$!\n{\n\tarchiveVersion = 1;\n\tclasses = {};\n\tobjectVersion = 56;\n\tobjects = {\n" + "\n".join(objects) + f"\n\t}};\n\trootObject = {ref('Project')};\n}}\n", encoding="utf-8")
schemes = project / "xcshareddata" / "xcschemes"
schemes.mkdir(parents=True, exist_ok=True)
reference = f'<BuildableReference BuildableIdentifier="primary" BlueprintIdentifier="{uid("Household Target")}" BuildableName="Household.app" BlueprintName="Household" ReferencedContainer="container:Household.xcodeproj"/>'
(schemes / "Household.xcscheme").write_text(f'''<?xml version="1.0" encoding="UTF-8"?>
<Scheme LastUpgradeVersion="1600" version="1.3">
 <BuildAction parallelizeBuildables="YES" buildImplicitDependencies="YES"><BuildActionEntries><BuildActionEntry buildForTesting="YES" buildForRunning="YES" buildForProfiling="YES" buildForArchiving="YES" buildForAnalyzing="YES">{reference}</BuildActionEntry></BuildActionEntries></BuildAction>
 <TestAction buildConfiguration="Debug" selectedDebuggerIdentifier="Xcode.DebuggerFoundation.Debugger.LLDB" selectedLauncherIdentifier="Xcode.IDEFoundation.Launcher.LLDB" shouldUseLaunchSchemeArgsEnv="YES"><Testables/></TestAction>
 <LaunchAction buildConfiguration="Debug" selectedDebuggerIdentifier="Xcode.DebuggerFoundation.Debugger.LLDB" selectedLauncherIdentifier="Xcode.IDEFoundation.Launcher.LLDB" launchStyle="0" useCustomWorkingDirectory="NO" ignoresPersistentStateOnLaunch="NO" debugDocumentVersioning="YES" debugServiceExtension="internal" allowLocationSimulation="YES"><BuildableProductRunnable runnableDebuggingMode="0">{reference}</BuildableProductRunnable></LaunchAction>
 <ProfileAction buildConfiguration="Release" shouldUseLaunchSchemeArgsEnv="YES" savedToolIdentifier="" useCustomWorkingDirectory="NO" debugDocumentVersioning="YES"><BuildableProductRunnable runnableDebuggingMode="0">{reference}</BuildableProductRunnable></ProfileAction>
 <AnalyzeAction buildConfiguration="Debug"/>
 <ArchiveAction buildConfiguration="Release" revealArchiveInOrganizer="YES"/>
</Scheme>
''', encoding="utf-8")
print("Generated ios/Household.xcodeproj")
