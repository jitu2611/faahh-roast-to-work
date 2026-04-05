const path = require('path');
const { execFile } = require('child_process');
const fs = require('fs');

/**
 * SoundPlayer — plays the Faahh alert sound.
 * Uses the OS native player for broad compatibility:
 *   - macOS: afplay
 *   - Windows: PowerShell + Media.SoundPlayer
 *   - Linux: aplay / paplay
 */
class SoundPlayer {
  constructor(customSoundPath = '') {
    this.customSoundPath = customSoundPath;
    this.defaultSoundPath = path.join(__dirname, '..', 'sounds', 'faahh.wav');
  }

  setCustomSound(soundPath) {
    this.customSoundPath = soundPath;
  }

  play() {
    const soundPath = this._resolveSoundPath();
    if (!soundPath) {
      console.warn('[SoundPlayer] No sound file found.');
      return;
    }

    try {
      switch (process.platform) {
        case 'darwin':
          execFile('afplay', [soundPath]);
          break;

        case 'win32':
          execFile('powershell', [
            '-NoProfile',
            '-NonInteractive',
            '-Command',
            `(New-Object Media.SoundPlayer '${soundPath.replace(/'/g, "''")}').PlaySync()`,
          ]);
          break;

        case 'linux':
          // Try paplay (PulseAudio), fall back to aplay (ALSA)
          execFile('paplay', [soundPath], (err) => {
            if (err) {
              execFile('aplay', [soundPath]);
            }
          });
          break;

        default:
          console.warn('[SoundPlayer] Unsupported platform:', process.platform);
      }
    } catch (err) {
      console.error('[SoundPlayer] Playback error:', err.message);
    }
  }

  _resolveSoundPath() {
    if (this.customSoundPath && fs.existsSync(this.customSoundPath)) {
      return this.customSoundPath;
    }
    if (fs.existsSync(this.defaultSoundPath)) {
      return this.defaultSoundPath;
    }
    return null;
  }
}

module.exports = SoundPlayer;
