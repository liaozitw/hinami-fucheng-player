const SUPPORT_URL = 'https://www.facebook.com/tainanoutlook';

export default function SupportFooter() {
  return (
    <footer className="support-footer">
      <div>
        <span className="support-heart" aria-hidden="true">♥</span>
        <p>
          <strong>喜歡 Hinami Fucheng Player 嗎？</strong>
          如果想支持開發者，歡迎到「台南意向 Tainan Outlook」粉絲專頁按讚、追蹤、分享，並訂閱最新消息。
        </p>
      </div>
      <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer">
        前往台南意向粉絲專頁
        <span aria-hidden="true">↗</span>
      </a>
    </footer>
  );
}
