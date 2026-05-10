import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  FriendJoinForm,
  GroupInvite,
  Landing,
  Loading,
  MOCK_FRIENDS,
  Result,
  TravelFormWizard,
  randomCode,
} from '../components/aitravel/AiTravelFlowViews'

export default function AiTravelPage() {
  const [searchParams] = useSearchParams()
  const roomParam = searchParams.get('room')

  const [view, setView]         = useState('landing')
  const [roomCode]              = useState(randomCode)
  const [friends, setFriends]   = useState([])
  const [tripInfo, setTripInfo] = useState(null)
  const [planData, setPlanData] = useState(null)

  useEffect(() => {
    if (view !== 'group-invite') return
    const t1 = setTimeout(() => setFriends([MOCK_FRIENDS[0]]), 2500)
    const t2 = setTimeout(() => setFriends([MOCK_FRIENDS[0], MOCK_FRIENDS[1]]), 5000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [view])

  if (roomParam) return <FriendJoinForm roomCode={roomParam} />

  const handleFormSubmit = info => {
    setTripInfo(info)
    if (info.travelType === 'group') setView('group-invite')
    else setView('loading')
  }
  const handleReset = () => { setTripInfo(null); setFriends([]); setPlanData(null); setView('landing') }

  return (
    <div>
      {view === 'landing'      && <Landing onStart={() => setView('form')} />}
      {view === 'form'         && <TravelFormWizard onSubmit={handleFormSubmit} onBack={() => setView('landing')} />}
      {view === 'group-invite' && <GroupInvite roomCode={roomCode} friends={friends} tripInfo={tripInfo} onProceed={() => setView('loading')} />}
      {view === 'loading'      && <Loading info={tripInfo} onDone={data => { if (data) { setPlanData(data); setView('result') } }} onBack={() => setView('form')} />}
      {view === 'result'       && <Result info={tripInfo} planData={planData} onReset={handleReset} />}
    </div>
  )
}
