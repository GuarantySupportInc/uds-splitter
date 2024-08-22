const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');
const process = require("process")
const path = require("path");
// process.env.SOMETHING


module.exports = {
  packagerConfig: {
    asar: true,
    name: 'uds-splitter-utility',
    icon: './icon',
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel', // WINDOWS
      config: {
        setupIcon: './icon.ico',
      },
      // Code Signing
      // https://www.electronforge.io/guides/code-signing/code-signing-windows
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        icon:  './icon.ico'
      }
    },
    {
      name: '@electron-forge/maker-pkg', // MAC
      config: {
        // keychain: 'my-secret-ci-keychain'
        // other configuration options
      }
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    }
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
  publishers: [
    {
      name: "@electron-forge/publisher-github",
      config: {
        repository: {
          owner: "GuarantySupportInc",
          name: "uds-splitter"
        },
        prerelease: false,
        draft: true,
        generateReleaseNotes: true,
      }
    }
  ]
};
