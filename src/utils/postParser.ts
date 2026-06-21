import {
  Message,
  RichBlockParagraph,
  RichBlockSectionHeading,
  RichBlockList,
  RichBlockPhoto,
  RichBlock,
  PhotoSize,
  RichTextHashtag,
  RichTextBold,
  RichBlockListItem,
} from "node-telegram-bot-api";
import { getLogger } from "@logtape/logtape";

const logger = getLogger(["RM6785Bot", "utils", "postParser"]);

export interface ParsedPostData {
  buildAuthor: string;
  buildDate: string;
  buildAndroidVersion: string;
  hashtags: string[];
  title: string;
  changelogs: string[];
  bugs: string[];
  notes?: string[];
  downloads: string[];
  downloadLink: string;
  sourcesLink: string;
  screenshotsLink: string;
  supportgroupLink: string;
}

export const parsePost = (m: Message): ParsedPostData | undefined => {
  if (!m.caption_entities) return undefined;

  const pp: ParsedPostData = {
    buildAuthor: "",
    buildDate: "",
    buildAndroidVersion: "",
    hashtags: [],
    title: "",
    changelogs: [],
    bugs: [],
    notes: [],
    downloads: [],
    downloadLink: "",
    sourcesLink: "",
    screenshotsLink: "",
    supportgroupLink: "",
  };

  // find all inline links
  let downloadLink: string = "";
  let sourcesLink: string = "";
  let screenshotsLink: string = "";
  let supportgroupLink: string = "";
  for (const entity of m.caption_entities) {
    if (entity.type != "text_link") continue;
    const url = entity.url!;
    const length = entity.length;
    const offset = entity.offset;
    const theText = m.caption!.substring(offset, offset + length);
    switch (theText) {
      case "Download":
        logger.info(`Download text_link: ${theText}, ${url}`);
        downloadLink = url;
        break;
      case "Sources":
        logger.info(`Sources text_link: ${theText}, ${url}`);
        sourcesLink = url;
        break;
      case "Screenshots":
        logger.info(`Screenshots text_link: ${theText}, ${url}`);
        screenshotsLink = url;
        break;
      case "Support group":
        logger.info(`Support group text_link: ${theText}, ${url}`);
        supportgroupLink = url;
        break;
      default:
        logger.warning(`unknown text_link: ${theText}, ${url}`);
    }
  }

  pp.downloadLink = downloadLink;
  pp.sourcesLink = sourcesLink;
  pp.screenshotsLink = screenshotsLink;
  pp.supportgroupLink = supportgroupLink;

  const lines = m.caption!.split("\n");
  let inSection:
    | ""
    | "hashtags"
    | "changelog"
    | "bugs"
    | "notes"
    | "downloads" = "";
  // parse line-by-line
  for (const l of lines) {
    if (l === "") continue;

    if (l.startsWith("#")) {
      inSection = "hashtags";
      pp.hashtags = l.split(" ");
      continue;
    }

    if (inSection === "hashtags") {
      inSection = "";
      pp.title = l;
      continue;
    }

    if (l.startsWith("• Author")) {
      pp.buildAuthor = l.split(":")[1].trim();
      continue;
    }
    if (l.startsWith("• Android version")) {
      pp.buildAndroidVersion = l.split(":")[1].trim();
      continue;
    }
    if (l.startsWith("• Build date")) {
      pp.buildDate = l.split(":")[1].trim();
      continue;
    }

    if (l.startsWith("Changelog")) {
      inSection = "changelog";
      continue;
    }
    if (l.startsWith("Bugs")) {
      inSection = "bugs";
      continue;
    }
    if (l.startsWith("Notes")) {
      inSection = "notes";
      continue;
    }
    if (l.startsWith("Downloads")) {
      inSection = "downloads";
      continue;
    }

    if (
      l.startsWith("Sources") ||
      l.startsWith("Screenshots") ||
      l.startsWith("Support group")
    )
      continue;

    if (!l.startsWith("• ")) continue;
    const lList = l.replace("• ", "");
    switch (inSection) {
      case "changelog":
        pp.changelogs.push(lList);
        break;
      case "bugs":
        pp.bugs.push(lList);
        break;
      case "notes":
        pp.notes?.push(lList);
        break;
      case "downloads":
        if (lList === "Download") continue;
        pp.downloads.push(lList);
        break;
      // default:
      //   throw new Error("unreachable");
    }
  }

  if (pp.notes?.length == 0) delete pp.notes;
  return pp;
};

export const constructPostRichBlock = (
  pd: ParsedPostData,
  bannerLink: string
): string => {
  const romName = pd.title.split("for")[0].trim();
  const screenshots = pd.screenshotsLink
    ? `\n<sub><a href="${pd.screenshotsLink}">Screenshots</a></sub>\n`
    : "";
  return `\
![](${bannerLink} "${romName}")

\\${pd.hashtags.join(" ")}

# ${pd.title}

- Author: ${pd.buildAuthor}
- Android version: ${pd.buildAndroidVersion}
- Build date: ${pd.buildDate}

## Changelog

- ${pd.changelogs.join("\n- ")}

## Bugs

- ${pd.bugs.join("\n- ")}

## Notes

- ${pd.notes?.join("\n- ")}

## Downloads

- ${pd.downloads.join("\n- ")}
- [Download](${pd.downloadLink})

<sub><a href="${pd.sourcesLink}">Sources</a></sub>
${screenshots}
<sub><a href="${pd.supportgroupLink}">Support group</a></sub>
`;
};

/* export */ const _constructPostRichBlock = (
  pd: ParsedPostData,
  banner: PhotoSize
): { blocks: RichBlock[] } => {
  const changelogRichListItems = pd.changelogs.map((v) => {
    return {
      label: v,
      blocks: [] as RichBlock[],
    } as RichBlockListItem;
  });
  const bugsRichListItems = pd.bugs.map((v) => {
    return {
      label: v,
      blocks: [] as RichBlock[],
    } as RichBlockListItem;
  });
  const downloadsRichListItems = pd.downloads.map((v) => {
    return {
      label: v,
      blocks: [] as RichBlock[],
    } as RichBlockListItem;
  });

  // notes is optional, so it's handled differently
  const notesBlock = [];
  if (pd.notes) {
    const notesRichListItems = pd.notes.map((v) => {
      return {
        label: v,
        blocks: [] as RichBlock[],
      } as RichBlockListItem;
    });
    notesBlock.push(
      {
        type: "heading",
        text: { type: "bold", text: "Notes" } as unknown as RichTextBold,
        size: 2,
      } as RichBlockSectionHeading,
      {
        type: "list",
        items: notesRichListItems,
      } as RichBlockList
    );
  }

  const built = {
    blocks: [
      {
        type: "photo",
        photo: [banner] as PhotoSize[],
      } as RichBlockPhoto,
      {
        type: "paragraph",
        text: pd.hashtags.join(" ") as unknown as RichTextHashtag,
        size: 6,
      } as RichBlockParagraph,
      {
        type: "heading",
        text: { type: "bold", text: pd.title } as unknown as RichTextBold,
        size: 1,
      } as RichBlockSectionHeading,
      {
        type: "list",
        items: [
          {
            label: `Author: ${pd.buildAuthor}`,
            blocks: [] as RichBlock[],
          } as RichBlockListItem,
          {
            label: `Android version: ${pd.buildAndroidVersion}`,
            blocks: [] as RichBlock[],
          } as RichBlockListItem,
          {
            label: `Build date: ${pd.buildDate}`,
            blocks: [] as RichBlock[],
          } as RichBlockListItem,
        ],
      } as RichBlockList,
      {
        type: "heading",
        text: { type: "bold", text: "Changelog" } as unknown as RichTextBold,
        size: 2,
      } as RichBlockSectionHeading,
      {
        type: "list",
        items: changelogRichListItems,
      } as RichBlockList,
      {
        type: "heading",
        text: { type: "bold", text: "Bugs" } as unknown as RichTextBold,
        size: 2,
      } as RichBlockSectionHeading,
      {
        type: "list",
        items: bugsRichListItems,
      } as RichBlockList,
      ...notesBlock,
      {
        type: "heading",
        text: { type: "bold", text: "Downloads" } as unknown as RichTextBold,
        size: 2,
      } as RichBlockSectionHeading,
      {
        type: "list",
        items: [
          ...downloadsRichListItems,
          {
            label: `[Download](${pd.downloadLink})`,
            blocks: [] as RichBlock[],
          } as RichBlockListItem,
        ],
      } as RichBlockList,
    ],
  };

  return built;
};
