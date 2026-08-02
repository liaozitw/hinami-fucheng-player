import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type Language = 'en' | 'zh-TW' | 'ja';

const messages = {
  en: {
    categories:'Categories', directoryTree:'Directories', buffering:'Buffering…', unsupportedPlayback:'This video format or codec is not supported by your browser.', previous:'Previous', next:'Next', page:'Page',
    home:'Home', library:'My Library', vr:'VR Space', history:'Watch History', search:'Search videos', admin:'Directory management', addDirectory:'Add directory', play:'Play now', allVideos:'All videos', allFolders:'All folders', recent:'Recently added', vrCollection:'Immersive VR collection', good:'Good', medium:'Average', bad:'Bad', noResults:'No matching videos', noResultsHint:'Try another rating or clear your search.', addVideoDirectory:'Add a video directory', pickerHelp:'Choose a folder with your system picker. Adding it does not scan it; start scanning manually in Admin.', choosing:'Choosing…', chooseFolder:'Choose folder', orPath:'or enter a full path', usePath:'Add this path', supported:'Supports MP4, WebM, MOV, MKV, WMV, AVI, M4V, OGV and VR videos', backLibrary:'Back to library', immersive:'Immersive mode', dragVr:'Drag to explore the 360° view', myRating:'My rating', zoomOut:'Zoom out', zoomIn:'Zoom in', resetZoom:'Reset zoom', toggleVr:'Toggle VR mode', supportTitle:'Like Hinami Fucheng Player?', supportText:'Support the developer by liking, following, sharing and subscribing to Tainan Outlook.', supportLink:'Visit Tainan Outlook', back:'Back to library', directoryControl:'Directory management', directoryIntro:'Directories are not scanned automatically. You decide when each source is indexed or updated.', videos:'videos', directories:'directories', extensions:'Scan extensions', save:'Save settings', saving:'Saving…', exportRatings:'Export my ratings', tags:'Clean up Tags', exclusions:'Excluded folders', sources:'Video sources', scan:'Scan', cancel:'Cancel', lastScan:'Last scan / progress', actions:'Actions', videoCount:'Videos', emptySources:'No video sources yet', selectFolder:'Choose a folder', reset:'Reset Hinami Player', resetting:'Resetting…', fullReset:'Full reset', language:'Language'
  },
  'zh-TW': {
    categories:'分類', directoryTree:'目錄架構', buffering:'緩衝中…', unsupportedPlayback:'瀏覽器不支援此影片格式或編碼，無法直接播放。', previous:'上一頁', next:'下一頁', page:'第',
    home:'首頁', library:'我的片庫', vr:'VR 空間', history:'播放記錄', search:'搜尋影片', admin:'目錄管理後台', addDirectory:'加入目錄', play:'立即播放', allVideos:'全部影片', allFolders:'全部目錄', recent:'最近加入', vrCollection:'沉浸式 VR 收藏', good:'好', medium:'中等', bad:'不好', noResults:'沒有符合條件的影片', noResultsHint:'試著選擇其他評分或清除搜尋條件。', addVideoDirectory:'加入影片目錄', pickerHelp:'使用系統資料夾選擇器加入目錄。加入時不會掃描，請稍後到管理後台手動啟動。', choosing:'正在選擇…', chooseFolder:'選擇資料夾', orPath:'或輸入完整路徑', usePath:'使用此路徑加入', supported:'支援 MP4、WebM、MOV、MKV、WMV、AVI、M4V、OGV 與 VR 影片', backLibrary:'返回片庫', immersive:'沉浸模式', dragVr:'拖曳畫面探索 360° 視角', myRating:'我的評分', zoomOut:'縮小', zoomIn:'放大', resetZoom:'重設縮放', toggleVr:'切換 VR 模式', supportTitle:'喜歡 Hinami Fucheng Player 嗎？', supportText:'歡迎到「台南意向 Tainan Outlook」粉絲專頁按讚、追蹤、分享，並訂閱最新消息。', supportLink:'前往台南意向粉絲專頁', back:'返回影片庫', directoryControl:'目錄管理', directoryIntro:'加入目錄時不會自動掃描；每個影片來源都由你決定何時建立或更新索引。', videos:'部影片', directories:'個目錄', extensions:'掃描副檔名', save:'儲存設定', saving:'儲存中', exportRatings:'匯出我的評分', tags:'整理 Tags', exclusions:'略過目錄', sources:'影片來源', scan:'掃描', cancel:'取消', lastScan:'最後掃描／進度', actions:'操作', videoCount:'影片數量', emptySources:'還沒有影片來源', selectFolder:'選擇資料夾', reset:'完全重置 Hinami Player', resetting:'重置中…', fullReset:'完全重置', language:'語言'
  },
  ja: {
    categories:'カテゴリー', directoryTree:'フォルダー', buffering:'バッファリング中…', unsupportedPlayback:'この動画形式またはコーデックはブラウザーでサポートされていません。', previous:'前へ', next:'次へ', page:'ページ',
    home:'ホーム', library:'マイライブラリ', vr:'VR スペース', history:'再生履歴', search:'動画を検索', admin:'フォルダー管理', addDirectory:'フォルダーを追加', play:'今すぐ再生', allVideos:'すべての動画', allFolders:'すべてのフォルダー', recent:'最近追加', vrCollection:'没入型 VR コレクション', good:'良い', medium:'普通', bad:'良くない', noResults:'条件に一致する動画がありません', noResultsHint:'別の評価を選ぶか、検索をクリアしてください。', addVideoDirectory:'動画フォルダーを追加', pickerHelp:'システムのフォルダー選択画面を使用します。追加時にはスキャンされないため、管理画面から手動で開始してください。', choosing:'選択中…', chooseFolder:'フォルダーを選択', orPath:'またはフルパスを入力', usePath:'このパスを追加', supported:'MP4、WebM、MOV、MKV、WMV、AVI、M4V、OGV、VR 動画に対応', backLibrary:'ライブラリに戻る', immersive:'没入モード', dragVr:'ドラッグして 360° ビューを探索', myRating:'自分の評価', zoomOut:'縮小', zoomIn:'拡大', resetZoom:'ズームをリセット', toggleVr:'VR モードを切替', supportTitle:'Hinami Fucheng Player を気に入りましたか？', supportText:'台南意向 Tainan Outlook の「いいね」、フォロー、シェア、購読で開発者を応援できます。', supportLink:'台南意向を見る', back:'ライブラリに戻る', directoryControl:'フォルダー管理', directoryIntro:'追加時に自動スキャンは行いません。各ソースをいつ更新するか自分で管理できます。', videos:'本の動画', directories:'個のフォルダー', extensions:'スキャンする拡張子', save:'設定を保存', saving:'保存中…', exportRatings:'評価をエクスポート', tags:'タグを整理', exclusions:'除外フォルダー', sources:'動画ソース', scan:'スキャン', cancel:'キャンセル', lastScan:'最終スキャン／進捗', actions:'操作', videoCount:'動画数', emptySources:'動画ソースはまだありません', selectFolder:'フォルダーを選択', reset:'Hinami Player を完全リセット', resetting:'リセット中…', fullReset:'完全リセット', language:'言語'
  }
} as const;

type Key = keyof typeof messages.en;
const detect = ():Language => {
  const saved = localStorage.getItem('hinami-language');
  if (saved === 'en' || saved === 'zh-TW' || saved === 'ja') return saved;
  const locale = navigator.language.toLowerCase();
  return locale.startsWith('zh') ? 'zh-TW' : locale.startsWith('ja') ? 'ja' : 'en';
};

const I18nContext = createContext({ language:'en' as Language, setLanguage:(_language:Language)=>{}, t:(key:Key)=>messages.en[key] as string });

export function I18nProvider({children}:{children:ReactNode}) {
  const [language,setLanguageState]=useState<Language>(detect);
  const value=useMemo(()=>({language,setLanguage:(next:Language)=>{localStorage.setItem('hinami-language',next);document.documentElement.lang=next;setLanguageState(next);},t:(key:Key)=>messages[language][key]}),[language]);
  document.documentElement.lang=language;
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n=()=>useContext(I18nContext);

export function LanguageSwitcher() {
  const {language,setLanguage,t}=useI18n();
  return <label className="language-switcher"><span>{t('language')}</span><select aria-label={t('language')} value={language} onChange={event=>setLanguage(event.target.value as Language)}><option value="en">English</option><option value="zh-TW">繁體中文</option><option value="ja">日本語</option></select></label>;
}
