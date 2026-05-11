import CalendarPicker from '../common/CalendarPicker'
export default function AiGenerationInputFormView({ openCalendar, setOpenCalendar, dates, tomorrow, applyDate }) {
  return (
    <div className="ai-generation-input-form-page">
      <main className="shell">
          <aside className="cover">
            <div className="brand">
              <a className="brand-mark" href="#">
                <span className="logo-box">✈</span>
                <span>폰가이즈</span>
              </a>
              <div className="step-mini" id="stepMini" aria-label="필수 입력 진행률"></div>
            </div>
      
            <section className="cover-copy">
              <div className="eyebrow">AI TRAVEL PLANNER</div>
              <h1>취향을 읽는<br />여행 설계</h1>
              <p>
                어디로, 누구와, 어떤 속도로 움직일지만 정하면 <br />
                일정의 뼈대가 자연스럽게 잡힙니다.
              </p>
            </section>
      
            <section className="summary-card" aria-live="polite">
              <div className="summary-list" id="coverSummary"></div>
              <div className="summary-chips" id="coverChips"></div>
            </section>
          </aside>
      
          <section className="work">
            <div className="work-inner">
              <header className="topbar">
                <div>
                  <h2>AI 여행 일정 생성</h2>
                  <p>한 번에 전부 묻지 않고, 여행을 설계하는 순서대로 짧게 이어갑니다.</p>
                </div>
                <div className="progress" aria-hidden="true"><span id="progressFill"></span></div>
              </header>
      
              <nav className="journey-nav" id="journeyNav" aria-label="여행 입력 단계"></nav>
      
              <form className="form stage" id="tripForm">
                <section className="step-panel active" data-step-panel="0">
                  <div className="step-hero">
                    <p>Step 01</p>
                    <h3>여행지를 선택해주세요.</h3>
                  </div>
                  <section className="panel">
                    <div className="panel-head">
                      <div className="title-wrap">
                        <span className="icon">🌍</span>
                        <div>
                          <h3>여행지</h3>
                          <p className="panel-note">대륙을 고르면 대표 국가가 열리고, 직접 입력도 함께 저장됩니다.</p>
                        </div>
                      </div>
                      <span className="badge required">필수</span>
                    </div>
                    <div className="continent-grid" id="contGrid"></div>
                    <div className="chips" id="countryChips"></div>
                    <div className="input-row">
                      <input className="input" id="destInput" type="text" placeholder="직접 입력 후 Enter (예: 포르투갈, 하와이)" />
                    </div>
                    <div className="tags chips" id="destinationTags"></div>
                    <div className="suggestion-block">
                      <div className="panel-head">
                        <div className="title-wrap">
                          <span className="icon">📍</span>
                          <div>
                            <h3>꼭 가고 싶은 장소</h3>
                            <p className="panel-note">랜드마크, 동네, 식당 이름까지 자유롭게 추가합니다.</p>
                          </div>
                        </div>
                        <span className="badge">선택</span>
                      </div>
                      <div className="input-row">
                        <input className="input" id="placeInput" type="text" placeholder="장소 입력 (예: 에펠탑, 신주쿠)" />
                        <button className="add-button" id="placeAddBtn" type="button">추가</button>
                      </div>
                      <div className="tags chips" id="placeTags"></div>
                    </div>
                  </section>
                  <div className="step-actions">
                    <p className="step-warning" id="step0Warning"></p>
                    <button className="step-action" type="button" data-go-step="1">일정 입력</button>
                  </div>
                </section>

                <section className="step-panel" data-step-panel="1">
                  <div className="step-hero">
                    <p>Step 02</p>
                    <h3>일정과 인원을 입력해주세요.</h3>
                  </div>
                  <div className="two-col">
                    <section className="panel">
                      <div className="panel-head">
                        <div className="title-wrap">
                          <span className="icon">📅</span>
                          <div>
                            <h3>여행 기간</h3>
                            <p className="panel-note">출발일과 귀국일을 선택해주세요.</p>
                          </div>
                        </div>
                        <span className="badge required">필수</span>
                      </div>
                      <div className="date-grid">
                        <div>
                          <span className="field-label">출발일</span>
                          <input
                            className="date-input"
                            id="startDate"
                            type="text"
                            value={dates.startDate}
                            placeholder="날짜 선택"
                            readOnly
                            onClick={() => setOpenCalendar('startDate')}
                          />
                        </div>
                        <div>
                          <span className="field-label">귀국일</span>
                          <input
                            className="date-input"
                            id="endDate"
                            type="text"
                            value={dates.endDate}
                            placeholder="날짜 선택"
                            readOnly
                            onClick={() => setOpenCalendar('endDate')}
                          />
                        </div>
                      </div>
                      <div className="notice" id="dateSummary"></div>
                    </section>
      
                    <section className="panel">
                      <div className="panel-head">
                        <div className="title-wrap">
                          <span className="icon">👥</span>
                          <div>
                            <h3>인원 구성</h3>
                            <p className="panel-note" id="travelerModeNote">개인 여행은 1명으로 일정이 생성됩니다.</p>
                          </div>
                        </div>
                      </div>
                      <div className="travel-mode" aria-label="여행 인원 유형">
                        <button className="active" type="button" data-travel-mode="personal">
                          <span>👤</span>
                          <strong>개인<small>혼자 계획하기</small></strong>
                        </button>
                        <button type="button" data-travel-mode="group">
                          <span>👥</span>
                          <strong>단체<small>함께 계획하기</small></strong>
                        </button>
                      </div>
                      <div className="counter-list" id="counterList" hidden={true}>
                        <div className="counter-row">
                          <div className="counter-name">🧑 <span>성인<small>만 19세 이상</small></span></div>
                          <div className="counter-control">
                            <button className="round" type="button" data-count="adults" data-dir="-1">−</button>
                            <span className="count" id="adultsVal">2</span>
                            <button className="round" type="button" data-count="adults" data-dir="1">+</button>
                          </div>
                        </div>
                        <div className="counter-row">
                          <div className="counter-name">🧒 <span>청소년<small>만 13~18세</small></span></div>
                          <div className="counter-control">
                            <button className="round" type="button" data-count="teens" data-dir="-1">−</button>
                            <span className="count" id="teensVal">0</span>
                            <button className="round" type="button" data-count="teens" data-dir="1">+</button>
                          </div>
                        </div>
                        <div className="counter-row">
                          <div className="counter-name">👧 <span>어린이<small>만 3~12세</small></span></div>
                          <div className="counter-control">
                            <button className="round" type="button" data-count="children" data-dir="-1">−</button>
                            <span className="count" id="childrenVal">0</span>
                            <button className="round" type="button" data-count="children" data-dir="1">+</button>
                          </div>
                        </div>
                        <div className="counter-row">
                          <div className="counter-name">👶 <span>유아<small>만 0~2세</small></span></div>
                          <div className="counter-control">
                            <button className="round" type="button" data-count="infants" data-dir="-1">−</button>
                            <span className="count" id="infantsVal">0</span>
                            <button className="round" type="button" data-count="infants" data-dir="1">+</button>
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>
                  <div className="step-actions end has-back">
                    <p className="step-warning" id="step1Warning"></p>
                    <div className="collab-help" id="collabHelp" hidden={true}>동시에 여행 계획을 세울 수 있어요.</div>
                    <button className="step-action light" type="button" data-go-step="0">이전</button>
                    <div className="step-action-group">
                      <button className="step-action collab-action" id="collabPlanBtn" type="button" hidden={true}>함께 계획하기</button>
                      <button className="step-action" type="button" data-go-step="2">예산 선택</button>
                    </div>
                  </div>
                </section>
      
                <section className="step-panel" data-step-panel="2">
                  <div className="step-hero">
                    <p>Step 03</p>
                    <h3>예산 범위를 선택해주세요.</h3>
                  </div>
                  <div>
                    <section className="panel">
                      <div className="panel-head">
                        <div className="title-wrap">
                          <span className="icon">💰</span>
                          <div>
                            <h3>예산 범위</h3>
                            <p className="panel-note">1인 기준, 하루 예상 지출입니다.</p>
                          </div>
                        </div>
                      </div>
                      <div className="budget-grid" id="budgetGrid"></div>
                      <div className="notice" id="budgetEstimate"></div>
                    </section>
                  </div>
                  <div className="step-actions">
                    <button className="step-action light" type="button" data-go-step="1">이전</button>
                    <button className="step-action" type="button" data-go-step="3">여행 강도 조정</button>
                  </div>
                </section>
      
                <section className="step-panel" data-step-panel="3">
                  <div className="step-hero">
                    <p>Step 04</p>
                    <h3>하루 이동 강도를 정해주세요.</h3>
                  </div>
                  <section className="panel">
                    <div className="panel-head">
                      <div className="title-wrap">
                        <span className="icon">⚡</span>
                        <div>
                          <h3>여행 강도</h3>
                          <p className="panel-note">휴양 중심부터 촘촘한 일정까지 조절합니다.</p>
                        </div>
                      </div>
                    </div>
                    <div className="intensity-wrap">
                      <div className="intensity-main">
                        <label className="score">
                          <input id="intNum" type="number" min="0" max="100" defaultValue="0" />
                          <span>/100</span>
                        </label>
                        <div className="intensity-text" id="intDesc">강도를 정해주세요</div>
                      </div>
                      <input className="range" id="intSlider" type="range" min="0" max="100" defaultValue="0" />
                      <div className="range-labels">
                        <span>휴양</span><span>여유</span><span>알찬</span><span>최대</span>
                      </div>
                    </div>
                  </section>
                  <div className="step-actions">
                    <button className="step-action light" type="button" data-go-step="2">이전</button>
                    <button className="step-action" type="button" data-go-step="4">스타일 선택</button>
                  </div>
                </section>
      
                <section className="step-panel" data-step-panel="4">
                  <div className="step-hero">
                    <p>Step 05</p>
                    <h3>원하는 여행 스타일을 더해주세요.</h3>
                  </div>
                  <section className="panel">
                    <div className="panel-head">
                      <div className="title-wrap">
                        <span className="icon">✨</span>
                        <div>
                          <h3>여행 스타일</h3>
                          <p className="panel-note">선택하면 더 완벽한 일정을 만들 수 있습니다.</p>
                        </div>
                      </div>
                      <span className="badge">선택 추천</span>
                    </div>
                    <div className="hashbox">
                      <span className="hashmark">#</span>
                      <input id="styleInput" type="text" placeholder="스타일 입력 후 Enter (예: 힐링, 맛집탐방)" />
                    </div>
                    <p className="hint">Enter로 태그가 추가됩니다.</p>
                    <div className="suggestion-block">
                      <p className="suggestion-title">자주 쓰는 스타일</p>
                      <div className="purpose-grid" id="styleSuggestChips"></div>
                    </div>
                    <div className="tags chips" id="styleTags"></div>
                    <div className="action-bar">
                      <div className="bar-copy">
                        <p className="bar-title" id="barTitle">여행 조건을 입력해주세요</p>
                        <p className="bar-sub" id="barSub">여행지와 기간이 필요합니다.</p>
                      </div>
                      <button className="submit" id="submitBtn" type="button" disabled={true}>일정 생성하기</button>
                    </div>
                  </section>
                  <div className="step-actions">
                    <button className="step-action light" type="button" data-go-step="3">이전</button>
                  </div>
                </section>
              </form>
            </div>
          </section>
        </main>
      
        <div className="confirm-modal" id="confirmModal" role="dialog" aria-modal="true" aria-labelledby="confirmTitle">
          <section className="confirm-dialog">
            <div className="confirm-head">
              <h3 id="confirmTitle">입력한 조건을 확인해주세요</h3>
              <p>이 내용 그대로 AI 여행 일정을 생성합니다.</p>
            </div>
            <dl className="confirm-body" id="confirmBody"></dl>
            <div className="confirm-actions">
              <button className="confirm-button light" id="confirmCloseBtn" type="button">수정하기</button>
              <button className="confirm-button primary" id="confirmCreateBtn" type="button">이대로 생성하기</button>
            </div>
          </section>
        </div>
        <div className="confirm-modal" id="collabConfirmModal" role="dialog" aria-modal="true" aria-labelledby="collabConfirmTitle">
          <section className="confirm-dialog collab-dialog">
            <div className="confirm-head">
              <h3 id="collabConfirmTitle">다른 사람과 동시에 작업할까요?</h3>
              <p>함께 작업을 선택하면 공유 URL을 만들고, 방장이 먼저 작업창을 열 수 있습니다.</p>
            </div>
            <div className="collab-confirm-body">
              <div className="collab-mode-card">
                <strong>혼자 이어가기</strong>
                <span>현재 입력폼에서 계속 여행 조건을 작성합니다.</span>
              </div>
              <div className="collab-mode-card active">
                <strong>함께 작업하기</strong>
                <span>URL을 공유하고 같은 입력 항목을 협업 화면에서 작성합니다.</span>
              </div>
            </div>
            <div className="collab-member-body">
              <label htmlFor="collabMemberCount">동시작업 인원</label>
              <div className="collab-member-row">
                <button className="confirm-button light" id="collabMemberMinusBtn" type="button">-</button>
                <input id="collabMemberCount" type="number" min="2" max="20" defaultValue="2" />
                <button className="confirm-button light" id="collabMemberPlusBtn" type="button">+</button>
              </div>
              <p id="collabMemberGuide">방장을 포함해 함께 입력할 사람 수를 정해주세요.</p>
            </div>
            <div className="confirm-actions">
              <button className="confirm-button light" id="collabSoloBtn" type="button">혼자 할게요</button>
              <button className="confirm-button primary" id="collabTogetherBtn" type="button">함께 작업하기</button>
            </div>
          </section>
        </div>
        <div className="confirm-modal" id="collabShareModal" role="dialog" aria-modal="true" aria-labelledby="collabShareTitle">
          <section className="confirm-dialog collab-dialog">
            <div className="confirm-head">
              <h3 id="collabShareTitle">동시작업 URL이 생성되었습니다</h3>
              <p>방장이 이 URL을 복사해 함께 작업할 사람들에게 공유하면 됩니다.</p>
            </div>
            <div className="collab-share-body">
              <label htmlFor="collabRoomUrl">공유 URL</label>
              <div className="collab-url-row">
                <input id="collabRoomUrl" type="text" readOnly />
                <button className="confirm-button light" id="collabCopyBtn" type="button">URL 복사</button>
              </div>
              <p className="collab-copy-state" id="collabCopyState"></p>
            </div>
            <div className="confirm-actions">
              <button className="confirm-button light" id="collabBackBtn" type="button">이전</button>
              <button className="confirm-button primary" id="collabOpenRoomBtn" type="button">작업창 생성</button>
            </div>
          </section>
        </div>
        {openCalendar === 'startDate' && (
          <CalendarPicker
            value={dates.startDate}
            minDate={tomorrow}
            onChange={value => applyDate('startDate', value)}
            onClose={() => setOpenCalendar(null)}
          />
        )}
        {openCalendar === 'endDate' && (
          <CalendarPicker
            value={dates.endDate}
            minDate={dates.startDate || tomorrow}
            rangeStart={dates.startDate}
            onChange={value => applyDate('endDate', value)}
            onClose={() => setOpenCalendar(null)}
          />
        )}
    </div>
  )
}
