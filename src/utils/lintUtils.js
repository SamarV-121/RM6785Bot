/* eslint-disable prefer-const */
/* eslint-disable no-unsafe-optional-chaining */
const lintTelegramPost = (text, entities) => {
  let KERNEL = false;
  let boldTitle = false;
  let boldNotes = false;
  let boldChangelog = false;
  let boldBugs = false;
  let boldDownloads = false;
  let hashtags = [];

  const validateHashtags = () => {
    let errorMessage = "";
    hashtags = text.match(/#\w+/g)?.map((tag) => tag.slice(1)) || [];
    let [
      TAG_BRAND,
      TAG_BUILD,
      TAG_RELEASE_TYPE,
      TAG_DEVICE,
      TAG_ANDROID_VER,
      TAG_RUI_VER,
    ] = hashtags;

    if (TAG_BUILD === "KERNEL") {
      KERNEL = true;
      [TAG_DEVICE, TAG_RUI_VER] = [hashtags[2], hashtags[3]];
    }

    if (TAG_ANDROID_VER.includes("RMX")) {
      [TAG_ANDROID_VER, TAG_RUI_VER] = [hashtags[5], hashtags[6]];
    }

    const RELEASE_TYPE = ["UNOFFICIAL", "OFFICIAL"];
    const BUILD_TYPE = ["ROM", "KERNEL", "RECOVERY"];
    const DEVICE = ["RM6785", "RMX2001", "RMX2151", "salaa"];
    const ANDROID_VERSION = ["A10", "A11", "A12", "A13", "A14"];
    const RUI_VERSION = ["RUI1", "RUI2", "RUI3"];

    if (hashtags.length === 0) {
      return "Hashtags:\n• No hashtags were found.";
    }

    if (!BUILD_TYPE.includes(TAG_BUILD)) {
      errorMessage +=
        "• Incorrect build type mentioned on the second hashtag. (ROM/KERNEL/RECOVERY)\n";
    }

    if (!KERNEL && !RELEASE_TYPE.includes(TAG_RELEASE_TYPE)) {
      errorMessage +=
        "• Incorrect release type mentioned on the third hashtag. (OFFICIAL/UNOFFICIAL)\n";
    }

    if (!DEVICE.includes(TAG_DEVICE)) {
      if (KERNEL) {
        errorMessage += `• Incorrect device mentioned on the third hashtag. (RM6785/RMX2001/RMX2151/salaa)\n`;
      } else {
        errorMessage += `• Incorrect device mentioned on the fourth hashtag. (RM6785/RMX2001/RMX2151/salaa)\n`;
      }
    }

    if (!KERNEL && !ANDROID_VERSION.includes(TAG_ANDROID_VER)) {
      errorMessage += `• Incorrect Android version mentioned on the fifth hashtag. (A10/A11/A12/A13)\n`;
    }

    if (!RUI_VERSION.includes(TAG_RUI_VER)) {
      errorMessage += `• Incorrect RealmeUI version mentioned on the last hashtag. (RUI1/RUI2/RUI3)\n`;
    }

    return errorMessage ? `Hashtags:\n${errorMessage}` : "";
  };

  const validateBold = () => {
    // Notes may be omitted, in that case
    // set it to true so we don't fail the test
    if (!text.includes("Notes")) {
      boldNotes = true;
    }

    const boldEntities = entities.filter((entity) => entity.type === "bold");

    let word;
    boldEntities.forEach((entity) => {
      word = text.substring(entity.offset, entity.offset + entity.length);
      if (word.includes("Notes")) boldNotes = true;
      else if (word.includes("Changelog")) boldChangelog = true;
      else if (word.includes("Bugs")) boldBugs = true;
      else if (word.includes("Downloads")) boldDownloads = true;
      else if (
        word.includes(
          "for Realme 6/6i(Indian)/6s/7/Narzo/Narzo 20 Pro/Narzo 30 4G"
        ) ||
        word.includes("for Realme 6/6i(Indian)/6s/Narzo ONLY") ||
        word.includes("for Realme 7/Narzo 20 Pro/Narzo 30 4G ONLY")
      ) {
        boldTitle = true;
      }
    });

    return "";
  };

  const validateTitle = () => {
    let errorMessage = "";
    const titleNewlines = text
      .slice(
        text.lastIndexOf(hashtags[hashtags.length - 1]) +
          hashtags[hashtags.length - 1]?.length
      )
      .slice(
        0,
        text
          .slice(
            text.lastIndexOf(hashtags[hashtags.length - 1]) +
              hashtags[hashtags.length - 1]?.length
          )
          .search(/\S/)
      )
      .match(/\n/g);

    const title = text.match(/.*\w+(?= +for).*/)[0];

    if (!title) {
      return "Title:\n• No title found.";
    }

    if (titleNewlines?.length !== 2) {
      errorMessage += "• Missing two newlines before the title\n";
    }

    if (!boldTitle) {
      errorMessage += "• Missing bold format on title\n";
    }

    if (
      !title.includes(
        "for Realme 6/6i(Indian)/6s/7/Narzo/Narzo 20 Pro/Narzo 30 4G"
      ) &&
      !title.includes("for Realme 6/6i(Indian)/6s/Narzo ONLY") &&
      !title.includes("for Realme 7/Narzo 20 Pro/Narzo 30 4G ONLY")
    ) {
      errorMessage += "• Missing or incorrect order of device in title.\n";
    }

    if (!title.match(/\[([^\]]+)\]$/)) {
      errorMessage +=
        "• Missing build's stability stage. (ALPHA/BETA/STABLE)\n";
    }

    return errorMessage ? `Title:\n${errorMessage}` : "";
  };

  const validateBuildInfo = () => {
    let errorMessage = "";
    let type;
    if (KERNEL) {
      type = "Kernel";
    } else {
      type = "Android";
    }

    const infoPattern = `(.+)\n• Author:(.+)?\n• ${type} version:(.+)?\n• Build date:(.+)?`;
    if (!text.match(new RegExp(infoPattern, "i"))) {
      return "Build info:\n• Invalid build info section";
    }

    if (!text.match(new RegExp(infoPattern))) {
      errorMessage += "• Incorrect case\n";
    }

    if (!text.match(/(.+)\n• Author: (.+)/)) {
      errorMessage += "• Invalid author info\n";
    }

    if (!text.match(new RegExp(`\n• ${type} version: (.+)`))) {
      errorMessage += `• Invalid ${type} version info\n`;
    }

    if (
      !text.match(
        /\n• Build date: (0?[1-9]|[12][0-9]|3[01])-(0?[1-9]|1[0-2])-\d{4}/
      )
    ) {
      errorMessage += "• Invalid build date info (Required format: DD-MM-YY)\n";
    }

    return errorMessage ? `Build info:\n${errorMessage}` : "";
  };

  const validateChangelogBugs = () => {
    let errorMessage = "";
    const matchPattern =
      "\n\nChangelog\n(.+\n)+\nBugs\n(.+\n)+(\nNotes\n(.+\n)+)?";

    if (!text.match(new RegExp(matchPattern, "i"))) {
      return "Changelog/Bugs:\n• Invalid Changelog/Bugs section.";
    }

    if (!text.match(new RegExp(matchPattern))) {
      errorMessage += "• Incorrect case.\n";
    } else {
      if (!boldChangelog) {
        errorMessage += "• Missing bold format on Changelog\n";
      }
      if (!boldBugs) {
        errorMessage += "• Missing bold format on Bugs\n";
      }
      if (!boldNotes) {
        errorMessage += "• Missing bold format on Notes\n";
      }
    }

    if (!text.match(/\n\nChangelog\n•/)) {
      errorMessage += "• Invalid Changelog section.\n";
    }

    if (!text.match(/\nBugs\n•/)) {
      errorMessage += "• Invalid Bugs section.\n";
    }

    if (text.match(/\nNote/i)) {
      if (!text.match(/\nNotes\n•/)) {
        errorMessage += "• Invalid notes section.\n";
      }
    }

    return errorMessage ? `Changelog/Bugs:\n${errorMessage}` : "";
  };

  const validateDownloads = () => {
    let errorMessage = "";
    const matchPattern =
      "\n\nDownloads\n• Build type:(.+)?\n• File size:(.+)?\n• Download\n";

    if (!text.match(new RegExp(matchPattern, "i"))) {
      return "Downloads:\n• Invalid Downloads section.";
    }

    if (!text.match(new RegExp(matchPattern))) {
      errorMessage += "• Incorrect case.\n";
    } else if (!boldDownloads) {
      errorMessage += "• Missing bold format on Downloads.\n";
    }

    if (!KERNEL && !text.match(/(.+)\n• Build type: (.+)/)) {
      errorMessage += "• Invalid build type\n";
    }

    if (!text.match(/(.+)\n• File size: (.+)/)) {
      errorMessage += "• Invalid file size\n";
    }

    return errorMessage ? `Downloads:\n${errorMessage}` : "";
  };

  const validateFooter = () => {
    let errorMessage = "";
    let matchPattern;
    if (KERNEL) {
      matchPattern = "\nSources\nSupport group";
    } else {
      matchPattern = "\nSources\nScreenshots\nSupport group";
    }

    if (!text.match(new RegExp(matchPattern, "i"))) {
      return (
        "Footer:\n• Invalid footer section." +
        "\n  Should be written exactly like this:" +
        matchPattern
      );
    }

    if (!text.match(new RegExp(matchPattern))) {
      errorMessage += "• Incorrect case.\n";
      errorMessage += "Correct usage:" + matchPattern;
    }

    return errorMessage ? `Footer:\n${errorMessage}` : "";
  };

  const errors = `\n${validateHashtags()}${validateBold()}${validateTitle()}
${validateBuildInfo()}${validateChangelogBugs()}${validateDownloads()}
${validateFooter()}`;

  const lintStatus = !errors.trim();
  const lintResult = lintStatus
    ? "Seems good 🤌\nBot approves"
    : `<b>ERRORS</b>\n${errors}`;

  return [lintResult, lintStatus];
};

module.exports = lintTelegramPost;
