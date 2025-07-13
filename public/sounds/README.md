# Quiz Sound Effects

This directory contains sound effects for different quiz performance levels:

- `perfect.mp3` - Perfect score (100%) sound
- `excellent.mp3` - Excellent performance (80%+) sound  
- `pass.mp3` - Passing grade sound
- `fail.mp3` - Failed attempt sound

## Usage

These sounds are played automatically when quiz results are displayed, similar to Duolingo's feedback system.

## Fallback

If sound files are not available, the system will attempt to generate simple beep sounds using Web Audio API.
