const { createCanvas, loadImage } = require("@napi-rs/canvas");
const path = require("path");

// Helper to draw image with different fit modes
function drawImageProp(ctx, img, x, y, w, h, offsetX, offsetY) {
  if (arguments.length === 2) {
    x = y = 0;
    w = ctx.canvas.width;
    h = ctx.canvas.height;
  }

  /// default offset is center
  offsetX = typeof offsetX === "number" ? offsetX : 0.5;
  offsetY = typeof offsetY === "number" ? offsetY : 0.5;

  // keep bounds [0.0, 1.0]
  if (offsetX < 0) offsetX = 0;
  if (offsetY < 0) offsetY = 0;
  if (offsetX > 1) offsetX = 1;
  if (offsetY > 1) offsetY = 1;

  var iw = img.width,
    ih = img.height,
    r = Math.min(w / iw, h / ih),
    nw = iw * r, // new prop. width
    nh = ih * r, // new prop. height
    cx,
    cy,
    cw,
    ch,
    ar = 1;

  // decide which gap to fill
  if (nw < w) ar = w / nw;
  if (Math.abs(ar - 1) < 1e-14 && nh < h) ar = h / nh; // updated
  nw *= ar;
  nh *= ar;

  // calc source rectangle
  cw = iw / (nw / w);
  ch = ih / (nh / h);

  cx = (iw - cw) * offsetX;
  cy = (ih - ch) * offsetY;

  // make sure source rectangle is valid
  if (cx < 0) cx = 0;
  if (cy < 0) cy = 0;
  if (cw > iw) cw = iw;
  if (ch > ih) ch = ih;

  // fill image in dest. rectangle
  ctx.drawImage(img, cx, cy, cw, ch, x, y, w, h);
}

// Variables replacement helper
const replaceVariables = (text, member) => {
  if (!text) return "";
  return text
    .replace(/\[user\]/g, `<@${member.id}>`)
    .replace(/\[userName\]/g, member.user.username)
    .replace(/\[memberCount\]/g, member.guild.memberCount)
    .replace(/\[server\]/g, member.guild.name);
};

// Rounded Rectangle Helper
function roundedRect(ctx, x, y, width, height, radius) {
  // Clamp radius to 50% of the smallest dimension
  const maxRadius = Math.min(width, height) / 2;
  const computedRadius = (radius / 50) * maxRadius; // radius input is 0-50, mapping to 0-50%

  ctx.beginPath();
  ctx.moveTo(x + computedRadius, y);
  ctx.lineTo(x + width - computedRadius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + computedRadius);
  ctx.lineTo(x + width, y + height - computedRadius);
  ctx.quadraticCurveTo(
    x + width,
    y + height,
    x + width - computedRadius,
    y + height
  );
  ctx.lineTo(x + computedRadius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - computedRadius);
  ctx.lineTo(x, y + computedRadius);
  ctx.quadraticCurveTo(x, y, x + computedRadius, y);
  ctx.closePath();
}

async function generateWelcomeImage(member, settings) {
  const width = 800;
  const height = 450;
  const cvs = createCanvas(width, height);
  const ctx = cvs.getContext("2d");

  // 1. Draw Background
  // Default color
  ctx.fillStyle = "#161616";
  ctx.fillRect(0, 0, width, height);

  if (settings.background && settings.background !== "none") {
    try {
      const bg = await loadImage(settings.background);
      const mode = settings.bgMode || "stretch";

      if (mode === "cover") {
        drawImageProp(ctx, bg, 0, 0, width, height, 0.5, 0.5);
      } else if (mode === "contain") {
        // Ensure aspect ratio is maintained and centered
        const scale = Math.min(width / bg.width, height / bg.height);
        const drawW = bg.width * scale;
        const drawH = bg.height * scale;
        const x = (width - drawW) / 2;
        const y = (height - drawH) / 2;
        ctx.drawImage(bg, x, y, drawW, drawH);
      } else {
        // Stretch (Default)
        ctx.drawImage(bg, 0, 0, width, height);
      }
    } catch (e) {
      console.error("Failed to load background image:", e);
    }
  }

  // 2. Draw Elements
  if (settings.elements && Array.isArray(settings.elements)) {
    for (const el of settings.elements) {
      ctx.save();

      // Apply Shadows
      if (el.shadowBlur > 0) {
        ctx.shadowColor = el.shadowColor || "#000000";
        ctx.shadowBlur = el.shadowBlur;
        ctx.shadowOffsetX = el.shadowOffsetX || 2;
        ctx.shadowOffsetY = el.shadowOffsetY || 2;
      }

      if (el.type === "text") {
        const fontSize = el.fontSize || 32;
        const fontFamily = "sans-serif";
        const fontWeight = el.style === "bold" ? "bold " : "";
        const fontStyle = el.style === "italic" ? "italic " : "";

        ctx.font = `${fontStyle}${fontWeight}${fontSize}px ${fontFamily}`;
        ctx.fillStyle = el.color || "#ffffff";

        // Alignment Logic matches Frontend Transform
        // Frontend:
        //  Align Left   -> translate(0, -50%)      -> Anchor is (left, middle)
        //  Align Center -> translate(-50%, -50%)   -> Anchor is (center, middle)
        //  Align Right  -> translate(-100%, -50%)  -> Anchor is (right, middle)

        ctx.textAlign = el.align || "left";
        ctx.textBaseline = "middle";

        const text = replaceVariables(el.content, member);

        // Stroke (Border) - Draw first
        if (el.strokeWidth > 0) {
          ctx.strokeStyle = el.strokeColor || "#000000";
          ctx.lineWidth = el.strokeWidth;
          ctx.strokeText(text, el.x, el.y);
        }

        // Fill Text
        ctx.fillText(text, el.x, el.y);
      } else if (el.type === "avatar") {
        try {
          const avatarUrl = member.user.displayAvatarURL({
            extension: "png",
            size: 512,
          });
          const avatarImg = await loadImage(avatarUrl).catch(() =>
            loadImage("https://cdn.discordapp.com/embed/avatars/0.png")
          );

          // Clipping for Radius
          // Radius in frontend is 0-50 (representing percentage of half-size)
          const cornerRadius = el.radius || 0;

          if (cornerRadius > 0) {
            roundedRect(ctx, el.x, el.y, el.width, el.height, cornerRadius);
            ctx.clip();
          }

          ctx.drawImage(avatarImg, el.x, el.y, el.width, el.height);
        } catch (e) {
          console.error("Failed to render avatar:", e);
        }
      }

      ctx.restore();
    }
  }

  return cvs.toBuffer("image/png");
}

module.exports = { generateWelcomeImage };
