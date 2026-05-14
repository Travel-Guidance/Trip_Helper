import "./TravelPreparation.css";

export default function TravelPreparation() {
  const prepItems = [
    {
      title: "여권",
      image: "/images/여권.png",
      info: "출발일 기준 유효기간이 <strong>6개월 이상</strong> 남았는지 반드시 확인하세요.<br>분실에 대비해 여권 번호를 따로 메모해 두는 것이 좋습니다.",
    },
    {
      title: "비자 (Visa)",
      image: "/images/비자.png",
      info: "방문하는 국가의 비자 면제 여부와 발급 소요 기간을 미리 체크하세요.<br>전자 비자(e-Visa)인 경우 출력물을 준비하는 것이 안전합니다.",
    },
    {
      title: "여행자보험",
      image: "/images/여행자보험.png",
      info: "예상치 못한 질병이나 물품 도난, 지연 등에 대비해 가입을 권장합니다.<br>영문 가입 증명서를 스마트폰에 캡처해 두면 유용합니다.",
    },
    {
      title: "충전기 & 보조배터리",
      image: "/images/돼지코_보조배터리.png",
      info: "보조배터리는 위탁 수하물이 아닌 <strong>반드시 기내 수하물</strong>로 들고 타야 합니다.<br>방문 국가에 맞는 멀티 어댑터(돼지코)도 잊지 마세요.",
    },
    {
      title: "문서 복사본",
      image: "/images/문서복사본.png",
      info: "여권 사본, E-티켓, 호텔 바우처 등 중요 문서는 종이로 1부 복사해 두세요.<br>핸드폰 분실이나 배터리 방전 등 비상시 큰 도움이 됩니다.",
    },
    {
      title: "삼각대 or 셀카봉",
      image: "/images/셀카봉_삼각대.png",
      info: "멋진 여행 사진을 남기기 위한 필수품입니다!<br>단, 기내 반입 규정(길이 제한)이나 관광지 내 반입 금지 여부를 확인하세요.",
    },
    {
      title: "비상약 키트",
      image: "/images/비상약키트.png",
      info: "소화제, 진통제, 밴드, 지사제 등 평소 본인에게 잘 맞는 상비약을 준비하세요.<br>해외에서는 증상에 맞는 약을 바로 구하기 어려울 수 있습니다.",
    },
    {
      title: "포켓 와이파이",
      image: "/images/포켓와이파이.png",
      info: "일행과 함께 데이터를 넉넉히 쓰고 싶다면 출국 전 미리 예약하세요.<br>공항 내 수령 위치를 확인하고, 귀국 후 반납 일정도 꼭 체크하세요.",
    },
  ];

  return (
    <div className="travel-prep-container">
      <header className="prep-header">
        <h1>✈️ 완벽한 여행을 위한 필수 준비물</h1>
        <p>
          여행의 시작은 꼼꼼한 준비부터! 잊기 쉬운 필수품들을 확인하고 든든하게
          떠나보세요.
        </p>
      </header>

      <div className="prep-grid">
        {prepItems.map((item, index) => (
          <div key={index} className="prep-card">
            <h2 className="card-title">{item.title}</h2>
            <div className="card-image">
              <img src={item.image} alt={item.title} />
            </div>
            <div className="card-info">
              <p dangerouslySetInnerHTML={{ __html: item.info }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
