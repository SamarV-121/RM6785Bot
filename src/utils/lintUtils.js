function lintTelegramPost(text) {
  let errors = "";
  const hashtags = text.match(/#\w+/g)?.map((tag) => tag.slice(1)) || [];
  if (hashtags.length == 0) return ["ERROR: No hashtags found", false];

  const hashtag1 = hashtags[0];
  const hashtag2 = hashtags[1];
  const hashtag3 = hashtags[2];
  const hashtag4 = hashtags[3];
  const hashtag5 = hashtags[4];
  const hashtag6 = hashtags[5];

  const titleNewlines = text
    .slice(
      text.lastIndexOf(hashtags[hashtags.length - 1]) +
        hashtags[hashtags.length - 1].length,
    )
    .slice(
      0,
      text
        .slice(
          text.lastIndexOf(hashtags[hashtags.length - 1]) +
            hashtags[hashtags.length - 1].length,
        )
        .search(/\S/),
    )
    .match(/\n/g);

  const title = text.match(/.*\w+(?= +for).*/)[0];
  const stage = title.match(/\[([^\]]+)\]$/)
    ? title.match(/\[([^\]]+)\]$/)[1]
    : "";

  // Hashtags
  if (!["UNOFFICIAL", "OFFICIAL"].includes(hashtag2)) {
    errors +=
      "ERROR: Incorrect status on second hashtag (OFFICIAL/UNOFFICIAL)\n";
  }
  if (!["ROM", "KERNEL", "RECOVERY"].includes(hashtag3)) {
    errors += "ERROR: Incorrect type on 3rd hashtag (ROM/KERNEL/RECOVERY)\n";
  }
  if (!["RM6785", "RMX2001", "RMX2151"].includes(hashtag4)) {
    errors +=
      "ERROR: Incorrect device on 4rd hashtag (RM6785/RMX2001/RMX2151)\n";
  }
  if (
    hashtag3 !== "KERNEL" &&
    !["A10", "A11", "A12", "A13"].includes(hashtag5)
  ) {
    errors += "ERROR: Incorrect version on 5th hashtag (A10/A11/A12/A13)\n";
  }

  if (hashtag3 == "KERNEL" && !["RUI1", "RUI2", "RUI3"].includes(hashtag5)) {
    errors +=
      "ERROR: Incorrect RealmeUI version on last hashtag (RUI1/RUI2/RUI3)\n";
  }

  if (hashtag3 !== "KERNEL" && !["RUI1", "RUI2", "RUI3"].includes(hashtag6)) {
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

  if (hashtag3 !== "KERNEL" && !text.match(/• Android version: [0-9].+/)) {
    errors += "ERROR: Android version\n";
  }

  if (
    !text.match(
      /• Build date: (0?[1-9]|[12][0-9]|3[01])-(0?[1-9]|1[0-2])-\d{4}/,
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
  if (hashtag3 !== "KERNEL" && !text.match(/\nScreenshots/)) {
    errors += "ERROR: Screenshots.\n";
  }
  if (!text.match(/\nSupport group/)) {
    errors += "ERROR: Support group.\n";
  }
  lintStatus = errors === "";
  lintResult = errors === "" ? "Seems good 🤌\nBot approves" : errors;

  return [lintResult, lintStatus];
}

module.exports = lintTelegramPost;
