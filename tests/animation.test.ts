import assert from 'node:assert/strict'
import {test} from 'node:test'
import {lessons} from '../src/core/catalog'
import {advanceFilm,sequences,startFilm} from '../src/core/cinema'
import {phenomena} from '../src/visual/three/phenomena'

for(const lesson of lessons)test(`分镜与物理通道 ${lesson.id} ${lesson.title}`,()=>{
  const cues=sequences[lesson.id],channels=phenomena(lesson.id),seen=new Set<number>(),values=new Set<string>()
  assert(cues.length>=3&&channels.length>=2)
  for(const channel of channels){assert(channel.points.length>=2&&channel.points.flat().every(Number.isFinite))}
  let film=startFilm(lesson)
  for(let step=0;!film.done&&step<300;step++){
    seen.add(film.index)
    const observation=channels.map(channel=>{const value=channel.read(film.run.state);assert(Number.isFinite(value),channel.label);return +value.toFixed(5)})
    values.add(JSON.stringify(observation));film=advanceFilm(lesson,film,.20)
  }
  assert(film.done);assert.equal(seen.size,cues.length);assert(values.size>=2,'工况变化必须改变一个可视物理量')
  assert.deepEqual(advanceFilm(lesson,film,1),film)
})
