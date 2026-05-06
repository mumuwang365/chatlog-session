# Changelog

## [0.25.0] - 2026-05-06

### Added

#### 富文本消息 subType=1 兼容

- 新增对 `type=49, subType=1` 链接类富文本消息的识别与展示，不再回退为 `[富文本消息] subType=1`。
- `subType=1` 消息复用 `LinkMessage` 组件，点击可在新窗口打开链接。
- 针对 `subType=1` 数据结构中 URL 存放于 `contents.title` 而非 `contents.url` 的实际情况，做了专用映射：标题显示域名，链接指向完整 URL。

#### 下载体验增强

- 文件消息点击改为强制 blob 下载（`request.download`），不再 `window.open` 在窗口内导航。
- 图片预览器下载改为 `request.download`，统一走 fetch → blob → 另存为路径。
- `request.download` 新增 content-type → 文件后缀推断：下载文件名无后缀时，根据响应的 MIME 类型自动补上正确扩展名（覆盖 30+ 种常见类型）。
- 图片下载文件名从 `image_1778046335000.jpg` 改为 `image_20260506_134535.jpg` 格式，可读性更好。

### Changed

#### 图片预览器重构

- 重写 `ImageViewer` 高清图后台加载逻辑：`new Image()` 加载失败时，自动尝试 `<video>` 加载以兼容 Live Photo（`video/mp4`），不再误报"高清加载失败"。
- 修复 `imageUrl` 计算优先级：当 `message.contents.md5` 存在时，优先用 `mediaAPI.getImageUrl(md5)` 获取高清图，而非 `message.content`（缩略图），确保缩略图与高清图 URL 不同时后台加载才能触发。
- 修复上一张/下一张切换失效：`resetAndLoad` 不再覆盖 `currentIndex`，索引由调用方负责。
- 精简组件状态与逻辑：8 个状态变量精简为 6 个，12 个函数精简为 7 个，合并两个 watch，键盘处理改为表驱动。

#### 置顶图标修复

- 修复本地置顶会话不显示 📎 图标的问题：`SessionItem` 中 Paperclip 图标条件从 `session.isPinned` 改为 `session.isPinned || session.isLocalPinned`。

#### 链接消息点击行为统一

- `isLinkMessage` 判断增加 `subType=1`，使该类消息点击时走 `handleLinkClick` → `window.open(linkUrl, '_blank')`。
- `linkUrl` 计算增加 `subType=1` 专用逻辑，从 `contents.title` 取 URL。

### Technical Details

- **修改文件**:
  - `src/types/message.ts` - 增加 `RichMessageSubType.Text = 1`
  - `src/components/chat/message-types/config.ts` - 新增 `subType=1` 配置，复用 `LinkMessage`
  - `src/components/chat/composables/useMessageType.ts` - `isLinkMessage` 增加 `subType=1` 判断
  - `src/components/chat/composables/useMessageContent.ts` - 同步 `isLinkMessage` 修改
  - `src/components/chat/composables/useMessageUrl.ts` - `linkUrl` 增加 `subType=1` 专用逻辑；`imageUrl` 优先级调整
  - `src/components/chat/MessageBubble.vue` - `handleFileClick` 改为 blob 下载；导入 `request`
  - `src/components/common/ImageViewer.vue` - 重构：Live Photo 兼容、下载走 `request.download`、状态精简、切图修复
  - `src/components/chat/SessionItem.vue` - Paperclip 图标条件修复
  - `src/utils/request.ts` - `download()` 增加 content-type 后缀推断；新增 `CONTENT_TYPE_EXT_MAP`、`extFromContentType()`、`hasExt()`

### User Experience

- `subType=1` 的链接消息现在能正常展示标题和链接，点击可在新窗口打开。
- 文件和图片下载不再在浏览器窗口内导航，而是触发"另存为"对话框。
- 下载的文件自动获得正确的后缀名（如 `.png`、`.pdf`、`.docx`），不再出现无后缀或后缀错误的情况。
- Live Photo 的高清资源不再被误报为"高清加载失败"，而是自动以视频模式播放。
- 本地置顶的会话现在能看到 📎 图标。
- 图片预览器中上一张/下一张切换恢复正常。

### Notes

- 本版本基于 `v0.24.0` 之后的提交整理，涵盖消息类型兼容、下载体验、图片预览器重构与 UI 修复。
