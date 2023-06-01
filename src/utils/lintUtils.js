const lintTelegramPost = (text) => {
  let errors = "";
  const hashtags = text.match(/#\w+/g)?.map((tag) => tag.slice(1)) || [];
  if (hashtags.length === 0) return ["ERROR: No hashtags found", false];

  const POST_ROM = hashtags[0];
  const POST_STATUS = hashtags[1];
  const POST_TYPE = hashtags[2];
  const POST_DEVICE = hashtags[3];
  const POST_ANDROID_VERSION = hashtags[4];
  const POST_RUI_VERSION = hashtags[5];

  const STATUSES = ["UNOFFICIAL", "OFFICIAL"];
  const TYPES = ["ROM", "KERNEL", "RECOVERY"];
  const DEVICES = ["RM6785", "RMX2001", "RMX2151"];
  const ANDROID_VERSIONS = ["A10", "A11", "A12", "A13"];
  const RUI_VERSIONS = ["RUI1", "RUI2", "RUI3"];

  const titleNewlines = text
    .slice(
      text.lastIndexOf(hashtags[hashtags.length - 1]) +
        hashtags[hashtags.length - 1].length
    )
    .slice(
      0,
      text
        .slice(
          text.lastIndexOf(hashtags[hashtags.length - 1]) +
            hashtags[hashtags.length - 1].length
        )
        .search(/\S/)
    )
    .match(/\n/g);

  const title = text.match(/.*\w+(?= +for).*/)[0];
  const stage = title.match(/\[([^\]]+)\]$/)
    ? title.match(/\[([^\]]+)\]$/)[1]
    : "";

  // Hashtags
  if (!STATUSES.includes(POST_STATUS)) {
    errors +=
      "ERROR: Incorrect status on second hashtag (OFFICIAL/UNOFFICIAL)\n";
  }

  if (!TYPES.includes(POST_TYPE)) {
    errors += "ERROR: Incorrect type on 3rd hashtag (ROM/KERNEL/RECOVERY)\n";
  }

  if (!DEVICES.includes(POST_DEVICE)) {
    errors +=
      "ERROR: Incorrect device on 4rd hashtag (RM6785/RMX2001/RMX2151)\n";
  }

  if (
    POST_TYPE !== "KERNEL" &&
    !ANDROID_VERSIONS.includes(POST_ANDROID_VERSION)
  ) {
    errors += "ERROR: Incorrect version on 5th hashtag (A10/A11/A12/A13)\n";
  } else if (
    POST_TYPE == "KERNEL" &&
    !RUI_VERSIONS.includes(POST_ANDROID_VERSION)
  ) {
    errors +=
      "ERROR: Incorrect RealmeUI version on last hashtag (RUI1/RUI2/RUI3)\n";
  }

  if (POST_TYPE !== "KERNEL" && !RUI_VERSIONS.includes(POST_RUI_VERSION)) {
    errors +=
      "ERROR: Incorrect RealmeUI version on last hashtag (RUI1/RUI2/RUI3)\n";
  }

  // Title
  if (titleNewlines?.length !== 2) {
    errors += "ERROR: There must be 2 newlines after last hashtag\n";
  }

  if (!stage) {
    errors += "ERROR: Mention ROM stage eg [ALPHA/BETA]\n";
  }

  // Build info
  if (!text.match(/• Author: .+/)) {
    errors += "ERROR: Author\n";
  }

  if (POST_TYPE !== "KERNEL" && !text.match(/• Android version: [0-9].+/)) {
    errors += "ERROR: Android version\n";
  }

  if (
    !text.match(
      /• Build date: (0?[1-9]|[12][0-9]|3[01])-(0?[1-9]|1[0-2])-\d{4}/
    )
  ) {
    errors += "ERROR: Build date\n";
  }

  if (!/Changelog\n(.*\n)*Bugs/.test(text)) {
    errors += "ERROR: Invalid changelog section.\n";
  }
  if (text.match(/\nnote/i)) {
    if (!text.match(/\nNotes\n•/)) {
      errors += "ERROR: Invalid notes section.\n";
    }
  }
  if (!text.match(/Bugs\n(.*\n)*Downloads/)) {
    errors += "ERROR: Invalid bugs section.\n";
  }
  if (!text.match(/• Build Type: .+\n• File Size: .+\n•.+/)) {
    errors += "ERROR: Invalid downloads section.\n";
  }
  if (!text.match(/\nSources/)) {
    errors += "ERROR: Sources.\n";
  }
  if (POST_TYPE !== "KERNEL" && !text.match(/\nScreenshots/)) {
    errors += "ERROR: Screenshots.\n";
  }
  if (!text.match(/\nSupport group/)) {
    errors += "ERROR: Support group.\n";
  }
  const lintStatus = errors === "";
  const lintResult = errors === "" ? "Seems good 🤌\nBot approves" : errors;

  return [lintResult, lintStatus];
};

module.exports = lintTelegramPost;
