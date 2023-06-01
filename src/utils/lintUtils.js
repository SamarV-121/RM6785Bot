const lintTelegramPost = (text) => {
  const ERROR_MESSAGE = "<b>ERROR:</b> ";

  let errors = "";
  const hashtags = text.match(/#\w+/g)?.map((tag) => tag.slice(1)) || [];
  if (hashtags.length == 0)
    return [
      ERROR_MESSAGE + "No hashtags were found. Please provide proper hashtags.",
      false,
    ];

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
      ERROR_MESSAGE +
      "Incorrect status type mentioned on the second hashtag. (OFFICIAL/UNOFFICIAL)\n";
  }

  if (!TYPES.includes(POST_TYPE)) {
    errors +=
      ERROR_MESSAGE +
      "Incorrect post type mentioned on the third hashtag. (ROM/KERNEL/RECOVERY)\n";
  }

  if (!DEVICES.includes(POST_DEVICE)) {
    errors +=
      ERROR_MESSAGE +
      "Incorrect device type mentioned on the fourth hashtag. (RM6785/RMX2001/RMX2151)\n";
  }

  if (
    POST_TYPE !== "KERNEL" &&
    !ANDROID_VERSIONS.includes(POST_ANDROID_VERSION)
  ) {
    errors +=
      ERROR_MESSAGE +
      "Incorrect Android version mentioned on the fifth hashtag. (A10/A11/A12/A13)\n";
  } else if (
    POST_TYPE == "KERNEL" &&
    !RUI_VERSIONS.includes(POST_ANDROID_VERSION)
  ) {
    errors +=
      ERROR_MESSAGE +
      "Incorrect RealmeUI version mentioned on the sixth hashtag. (RUI1/RUI2/RUI3)\n";
  }

  if (POST_TYPE !== "KERNEL" && !RUI_VERSIONS.includes(POST_RUI_VERSION)) {
    errors +=
      ERROR_MESSAGE +
      "Incorrect RealmeUI version mentioned on the sixth hashtag. (RUI1/RUI2/RUI3)\n";
  }

  // Title
  if (titleNewlines?.length !== 2) {
    errors +=
      ERROR_MESSAGE + "Please put two newlines after the sixth hashtag.\n";
  }

  if (!stage) {
    errors +=
      ERROR_MESSAGE +
      "Please mention the ROM's stability stage. (ALPHA/BETA/STABLE)\n";
  }

  // Build info
  if (!text.match(/• Author: .+/)) {
    errors += ERROR_MESSAGE + "Please mention the post's author. (@Author)\n";
  }

  if (POST_TYPE !== "KERNEL" && !text.match(/• Android version: [0-9].+/)) {
    errors +=
      ERROR_MESSAGE +
      "Please specify the Android version of the ROM. (12.0 (S)/12.1 (L)/13.0 (T))\n";
  }

  if (
    !text.match(
      /• Build date: (0?[1-9]|[12][0-9]|3[01])-(0?[1-9]|1[0-2])-\d{4}/
    )
  ) {
    errors +=
      ERROR_MESSAGE + "Please specify a build date for the ROM. (DD-MM-YYYY)\n";
  }

  if (!/Changelog\n(.*\n)*Bugs/.test(text)) {
    errors +=
      ERROR_MESSAGE +
      "Invalid changelogs section. Please provide proper changelogs.\n";
  }
  if (text.match(/\nnote/i)) {
    if (!text.match(/\nNotes\n•/)) {
      errors +=
        ERROR_MESSAGE + "Invalid notes section. Please provide proper notes.\n";
    }
  }
  if (!text.match(/Bugs\n(.*\n)*Downloads/)) {
    errors +=
      ERROR_MESSAGE + "Invalid bugs section. Please provide proper bugs.\n";
  }
  if (!text.match(/• Build Type: .+\n• File Size: .+\n•.+/)) {
    errors +=
      ERROR_MESSAGE +
      "Invalid downloads section. Please provide proper links.\n";
  }
  if (!text.match(/\nSources/)) {
    errors +=
      ERROR_MESSAGE +
      "Invalid sources. Please provide a link to the sources.\n";
  }
  if (POST_TYPE !== "KERNEL" && !text.match(/\nScreenshots/)) {
    errors +=
      ERROR_MESSAGE +
      "Invalid screenshots. Please provide a link to the screenshots.\n";
  }
  if (!text.match(/\nSupport group/)) {
    errors +=
      ERROR_MESSAGE +
      "Invalid support group. Please provide a link to the support group.\n";
  }
  lintStatus = errors === "";
  lintResult = errors === "" ? "Seems good 🤌\nBot approves" : errors;

  return [lintResult, lintStatus];
};

module.exports = lintTelegramPost;
