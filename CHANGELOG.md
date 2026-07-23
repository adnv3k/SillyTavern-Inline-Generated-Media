# Changelog

## 1.0.0 - 2026-07-23

First release.

- Renders SillyTavern's generated images inline inside the message text by
  cloning the native media container and keeping the real one alive off-screen.
- Forwards inline clicks (zoom, caption, delete, and the swipe arrows for
  regenerated images) to the real media controls.
- Controls stay hidden until you hover the image or focus one with the keyboard,
  then fade out when the pointer leaves.
- Restores the real image to its normal position while a message is being edited.
