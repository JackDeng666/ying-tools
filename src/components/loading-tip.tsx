import { Text } from 'ink'
import { Spinner } from './spinner'
import { useRef, useState } from 'react'

const Warn = '⚠'
const Right = '✔'
const Wrong = '✖'

type TipState = {
  state: 'loading' | 'warn' | 'success' | 'fail'
  tips: string[]
}
export const useTipState = () => {
  const [tipState, setTipState] = useState<TipState>()

  function loading(...tips: string[]) {
    setTipState({
      state: 'loading',
      tips,
    })
  }

  function warn(...tips: string[]) {
    setTipState({
      state: 'warn',
      tips,
    })
  }

  function success(...tips: string[]) {
    setTipState({
      state: 'success',
      tips,
    })
  }

  function fail(...tips: string[]) {
    setTipState({
      state: 'fail',
      tips,
    })
  }

  return {
    tipState,
    warn,
    loading,
    success,
    fail,
  }
}

export const useTipStateList = () => {
  const [tipStateList, setTipStateList] = useState<TipState[]>([])

  function addTipState(tipState: TipState) {
    let index = 0
    setTipStateList(prev => {
      index = prev.length
      return [...prev, tipState]
    })

    function setState(tipState: TipState) {
      setTipStateList(prev => prev.map((el, i) => (i === index ? tipState : el)))
    }

    function loading(...tips: string[]) {
      setState({ state: 'loading', tips })
    }

    function warn(...tips: string[]) {
      setState({ state: 'warn', tips })
    }

    function success(...tips: string[]) {
      setState({ state: 'success', tips })
    }

    function fail(...tips: string[]) {
      setState({ state: 'fail', tips })
    }

    return {
      setState,
      loading,
      warn,
      success,
      fail,
    }
  }

  function startLoading(...tips: string[]) {
    return addTipState({ state: 'loading', tips })
  }

  return {
    tipStateList,
    addTipState,
    startLoading,
  }
}

type LoadingTipProps = TipState
export function LoadingTip({ state, tips }: LoadingTipProps) {
  return (
    <Text>
      {state === 'loading' && <Spinner />}
      {state === 'warn' && <Text color="yellow">{Warn}</Text>}
      {state === 'success' && <Text color="green">{Right}</Text>}
      {state === 'fail' && <Text color="red">{Wrong}</Text>}
      <Text> {tips.join('')}</Text>
    </Text>
  )
}
