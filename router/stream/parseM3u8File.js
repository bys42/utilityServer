const { once } = require("node:events");
const { createReadStream } = require("node:fs");
const { createInterface } = require("node:readline");

// https://nodejs.org/api/readline.html#readline_example_read_file_stream_line_by_line
async function parseM3u8File(path) {
    try {
        const rl = createInterface({
            input: createReadStream(path),
            crlfDelay: Infinity,
        });

        let targetDuration = 0;
        let segments = [];
        let segment = {};
        let parseLine = parseTargetDuration;

        rl.on("line", (line) => {
            parseLine(line);
        });

        await once(rl, "close");

        return { targetDuration, segments };

        function parseTargetDuration(line) {
            if (line.startsWith("#EXT-X-TARGETDURATION")) {
                targetDuration = parseFloat(line.split(":")[1]);
                parseLine = parseSegmentDuration;
            }
        }

        function parseSegmentDuration(line) {
            if (line.startsWith("#EXTINF")) {
                segment.duration = parseFloat(line.split(":")[1].split(",")[0]);
                parseLine = parseSegmentTsFile;
            }
        }

        function parseSegmentTsFile(line) {
            segment.tsFile = line;
            segments.push(segment);
            segment = {};
            parseLine = parseSegmentDuration;
        }
    } catch (err) {
        console.error(err);
    }
}

module.exports = {
    parseM3u8File,
};
