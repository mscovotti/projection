import { ChangeEvent, useEffect, useState } from 'react'
import dayjs from 'dayjs'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'
import { Line } from "react-chartjs-2"

dayjs.extend(isSameOrBefore)
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)


interface ConditionNode {
  date: dayjs.Dayjs | null
  rate: number | null
  movement: number | null
  key: number
}

interface TimeParams {
  initDate: dayjs.Dayjs
  initAge: number
}


function App() {
  const [birthday, setBirthday] = useState<dayjs.Dayjs>(dayjs('1976-02-10'))
  const [labels, setLabels] = useState<string[]>([])
  const [values, setValues] = useState<number[]>([])
  const [initialCapital, setInitialCapital] = useState<number>(100000)
  const [timeParams, setTimeParams] = useState<TimeParams>()

  const [conditions, setConditions] = useState<ConditionNode[]>(
    [
      {
        date: dayjs().startOf('month'),
        rate: 7,
        movement: 500,
        key: 0
      },
      {
        date: dayjs().startOf('month').add(10, 'year'),
        rate: 7,
        movement: -2000,
        key: 1
      }
    ]
  )

  useEffect(() => {
    const initDate = dayjs().startOf('month')
    const initAge = dayjs().startOf('month').diff(birthday, 'year')
    setTimeParams({
      initDate: initDate,
      initAge: initAge,
    })
  }, [birthday])

  useEffect(() => {
    if (timeParams) {
      const getConditionByDate = (date: dayjs.Dayjs): ConditionNode => {
        return conditions.reduce((prev: ConditionNode, curr: ConditionNode) => {
          return curr.date?.isSameOrBefore(date) && curr.date?.isAfter(prev.date) ? curr : prev
        }, conditions[0])
      }
    
      let currentDate = timeParams.initDate.add(1, 'month')
      const labels: string[] = []
      const values: number[] = [initialCapital]
      // console.log('values', values)
      let cont = true
      const century = birthday.add(100, 'year')
      // console.log('century', century.toISOString())
      // while (cont && currentDate <= timeParams.endDate) {
      while (cont && currentDate <= century) {
        const condition = getConditionByDate(currentDate)
        const prevValue = values[values.length - 1]
        const capital = (prevValue + (condition.movement ?? 0)) * (1 + (condition.rate ?? 0) / 12 / 100)
  
        labels.push(`${currentDate.format('YYYY-MM')} (${currentDate.diff(birthday, 'year')})`)
        values.push(capital)
        if (capital < 0) cont = false
        currentDate = currentDate.add(1, 'month')
      }
      // console.log('values', values)
  
      setLabels(labels)
      setValues(values)
    }
  }, [birthday, conditions, initialCapital, timeParams])

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Proyección',
      },
    },
  }

  const handleCondChange = (idx: number, field: 'date' | 'rate' | 'movement') => (e: ChangeEvent<HTMLInputElement>) => {
    setConditions((conds) => {
      conds[idx][field] = field === 'date' ? dayjs(`${e.target.value}-01`) : parseInt(e.target.value ?? 0)
      return [...conds]
    })
  }

  const handleConditionRemove = (idx: number) => () => {
    setConditions((conds) => {
      const c = [...conds]
      c.splice(idx, 1)
      return c
    })
  }

  const handleAddCondition = () => {
    setConditions((conds) => {
      return [...conds, {date: null, rate: null, movement: null, key: conds.reduce((p, c) => ((c.key > p) ? c.key + 1 : p), 0)}]
    })
  }

  const handleChangeBirthday = (e: ChangeEvent<HTMLInputElement>) => {
    const d = dayjs(`${e.target.value}-01`)
    if (d.isValid()) setBirthday(dayjs(`${e.target.value}-01`))  
  }
  const handleChangeInitialCapital = (e: ChangeEvent<HTMLInputElement>) => {
    setInitialCapital(parseInt(e.target.value))  
  }

  return (
    <>
      <Line width={1000} height={350} options={options} data={{labels, datasets: [{data: values}]}} />
      <div>
        <label htmlFor='birthday'>Fecha Nacimiento</label><input id='birthday' defaultValue={birthday.format('YYYY-MM-DD')} onChange={handleChangeBirthday} /> <br />
        <label htmlFor='initCapital'>Capital inicial</label><input id='initCapital' defaultValue={initialCapital} onChange={handleChangeInitialCapital} />
      </div>
      {conditions?.map((cond, i) => {
        return (<div key={`${cond.key}`}>
          <label htmlFor={`${i}-date`}>Fecha</label>
          <input id={`${i}-date`} type="text" defaultValue={cond.date?.format('YYYY-MM') ?? ''} onChange={handleCondChange(i, 'date')} /> | 
          <label htmlFor={`${i}-date`}>Taza</label>
          <input id={`${i}-rate`} type="text" defaultValue={cond.rate ?? ''} onChange={handleCondChange(i, 'rate')} /> | 
          <label htmlFor={`${i}-date`}>Monto</label>
          <input id={`${i}-movement`} type="text" defaultValue={cond.movement ?? ''} onChange={handleCondChange(i, 'movement')} />
          <button onClick={handleConditionRemove(i)}>X</button>
        </div>)
      })}
      <button onClick={handleAddCondition}>+ Condición</button>
    </>
  )
}

export default App
