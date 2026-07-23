# SillyTavern Inline Generated Media

Moves the images that SillyTavern's Image Generation produces so they show up
inline, inside the message text, instead of in the separate media strip.

It does this by cloning the message's native media container into the message
body and keeping the real one alive but off-screen. Clicks on the inline copy
(zoom, caption, delete, and the swipe arrows for regenerated images) are
forwarded to the real controls, so everything behaves the same as before. The
controls stay hidden until you hover the image or focus one of them with the
keyboard.

## Requirements

SillyTavern with the built-in Image Generation extension. No other dependencies.

## Installation

### From URL (recommended)

1. Open Extensions in SillyTavern and click **Install Extension**.
2. Paste the repo URL:
   ```
   https://github.com/adnv3k/SillyTavern-Inline-Generated-Media
   ```
3. Install, then reload the page.

### Manual

Copy this folder into `SillyTavern/data/<user-handle>/extensions/` (or
`SillyTavern/public/scripts/extensions/third-party/`), then reload SillyTavern
and hard-refresh the page.

To check it loaded, open the browser console (F12) and look for:

```
[inline-generated-media] v1.0.0 initialized.
```

## Usage

There's nothing to configure. Once installed, generated images render inside the
message text. Hover an image (or tab to a control) to reveal zoom, caption,
delete, and the swipe arrows.

## How it works

- The real `.mes_media_wrapper` stays in the DOM but is moved off-canvas by CSS
  so SillyTavern keeps treating it as the live element.
- A clone of `.mes_media_container` is inserted into `.mes_text` and kept in sync
  (image source, title, swipe counter) whenever the original changes.
- A `MutationObserver` watches for message and media changes and re-syncs the
  clone. Clicks on the clone are captured and replayed on the matching real
  control.
- While a message is being edited, the clone is removed and the real image is
  restored to its normal position.

## Troubleshooting

- **No inline image, and no init line in the console:** the extension didn't
  load. Confirm the folder is in the right extensions directory and hard-refresh.
- **Image shows twice:** a stale copy from an older version may be cached; hard-
  refresh (or clear the extension folder and reinstall).
- **Controls never appear:** they're hidden until hover or keyboard focus by
  design. Move the pointer over the image.

## Credits

Original extension by Ali / OpenAI. Packaged for distribution by adnv3k.

## License

[MIT](LICENSE)
