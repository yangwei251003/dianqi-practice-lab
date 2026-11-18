import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Mesh } from 'three'
import { feederRecorder } from '../../content/automation/protection'
import { initialise, perform } from '../../core/engine'
import type { Snapshot } from '../../core/types'
import { Kit } from './kit'
import { buildStation } from './stations'

test('course 23 shows TRIP at 60 ms and moves the breaker only on 52a feedback at 80 ms',()=>{
  const kit=new Kit(feederRecorder)
  try {
    buildStation(kit,kit.root)
    kit.batch()
    const handle=kit.root.getObjectByName('52a'),lamp=kit.root.getObjectByName('TRIP')
    assert.ok(handle && lamp instanceof Mesh)
    function show(s:Snapshot) {
      // Reverse meter presentation order to verify that the two channels bind by identity.
      const frame={...s.frame,meters:[...s.frame.meters].reverse()}
      kit.actions.forEach(fn=>fn({...s,frame},0,0,false))
    }
    let run=perform(feederRecorder,initialise(feederRecorder),['replay',1])
    show(run.state)
    const closed=handle.rotation.x
    assert.equal(lamp.material,kit.material('off'))
    run=perform(feederRecorder,run,2)
    assert.equal(run.state.memory.cursor,60)
    show(run.state)
    assert.equal(lamp.material,kit.material('hot'))
    assert.equal(handle.rotation.x,closed)
    run=perform(feederRecorder,run,0.4)
    assert.equal(run.state.memory.cursor,80)
    show(run.state)
    assert.equal(lamp.material,kit.material('hot'))
    assert.notEqual(handle.rotation.x,closed)
    run=perform(feederRecorder,run,['breaker',1])
    run=perform(feederRecorder,run,['replay',1])
    run=perform(feederRecorder,run,2.4)
    show(run.state)
    assert.equal(run.state.memory.cursor,80)
    assert.equal(lamp.material,kit.material('hot'))
    assert.equal(handle.rotation.x,closed)
  } finally {kit.dispose()}
})
