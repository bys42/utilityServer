const { parseM3u8File } = require("./parseM3u8File");
const path = require("path");
const fs = require("fs");

const CHANNEL_M3U8_SIZE = 10;

let channelInfo = null;

async function init(m3u8Folder, tsUrlRoot) {
    const m3u8NameList = fs
        .readdirSync(m3u8Folder, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);
    const playlists = await Promise.all(
        m3u8NameList.map((m3u8Dir) => parseM3u8File(path.join(m3u8Folder, m3u8Dir, "index.m3u8")))
    );
    const targetDuration = Math.max(...playlists.map((playlist) => playlist.targetDuration));

    let discontinuities = [0];
    let segments = [];

    playlists.forEach((playlist, index) => {
        const uriPrefix = path.join(tsUrlRoot, m3u8NameList[index]);
        playlist.segments.forEach(
            (segment) => (segment.line = `#EXTINF:${segment.duration},\n${path.join(uriPrefix, segment.tsFile)}`)
        );
        playlist.segments[0].line = "#EXT-X-DISCONTINUITY\n" + playlist.segments[0].line;
        segments = segments.concat(playlist.segments);
        discontinuities.push(segments.length);
    });

    let startTimes = [];
    let totalDuration = segments.reduce((acc, { duration }) => {
        startTimes.push(acc);
        return acc + duration;
    }, 0);

    channelInfo = {
        startTimestamp: Date.now(),
        playlists,
        targetDuration,
        discontinuities,
        segments,
        startTimes,
        totalDuration,
        m3u8: {
            content: "",
            expiredTimestamp: 0,
        },
    };
}

function getM3u8() {
    const nowTimestamp = Date.now();
    if (nowTimestamp > channelInfo.m3u8.expiredTimestamp) {
        channelInfo.m3u8 = updateM3u8(channelInfo, nowTimestamp);
    }
    return channelInfo.m3u8.content;
}

function updateM3u8(channelInfo, nowTimestamp) {
    let elapsed = (nowTimestamp - channelInfo.startTimestamp) / 1e3;
    let loopCount = (elapsed / channelInfo.totalDuration) | 0;
    let offset = elapsed % channelInfo.totalDuration;

    let segmentIndex = channelInfo.startTimes.findLastIndex((startTime) => startTime <= offset);
    let mediaSequence = loopCount * channelInfo.segments.length + segmentIndex;
    let discontinuitySequence =
        loopCount * channelInfo.playlists.length +
        channelInfo.discontinuities.findIndex((discontinuity) => discontinuity >= segmentIndex);

    let segments = channelInfo.segments.slice(segmentIndex, segmentIndex + CHANNEL_M3U8_SIZE);
    while (segments.length < CHANNEL_M3U8_SIZE) {
        segments = segments.concat(channelInfo.segments.slice(0, CHANNEL_M3U8_SIZE - segments.length));
    }

    const m3u8Header = [
        "#EXTM3U",
        "#EXT-X-VERSION:3",
        `#EXT-X-TARGETDURATION:${channelInfo.targetDuration}`,
        `#EXT-X-MEDIA-SEQUENCE:${mediaSequence}`,
        `#EXT-X-DISCONTINUITY-SEQUENCE:${discontinuitySequence}`,
    ];

    return {
        content: m3u8Header.concat(segments.map((segment) => segment.line)).join("\n"),
        expiredTimestamp: nowTimestamp + segments[0].duration * 1000,
    };
}

function getCurrentInfo() {
    return channelInfo;
}

module.exports = {
    init,
    getM3u8,
    getCurrentInfo,
};
