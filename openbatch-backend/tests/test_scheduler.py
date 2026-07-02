from app.solver.scheduler import batch_time, schedule_jit


def ev_by_id(events):
    return {e.operation_id: e for e in events}


def test_sequential_within_unit_procedure():
    ups = [{"operations": [
        {"id": "a", "equipmentId": "R1"},
        {"id": "b", "equipmentId": "R1"},
    ]}]
    events = ev_by_id(schedule_jit(ups, {"a": 10, "b": 5}))
    assert events["a"].start_min == 0
    assert events["b"].start_min == events["a"].end_min == 10


def test_parallel_ups_no_shared_equipment():
    ups = [
        {"operations": [{"id": "a", "equipmentId": "R1"}]},
        {"operations": [{"id": "b", "equipmentId": "R2"}]},
    ]
    events = ev_by_id(schedule_jit(ups, {"a": 10, "b": 10}))
    assert events["a"].start_min == 0
    assert events["b"].start_min == 0


def test_shared_equipment_serializes():
    ups = [
        {"operations": [{"id": "a", "equipmentId": "R1"}]},
        {"operations": [{"id": "b", "equipmentId": "R1"}]},
    ]
    events = ev_by_id(schedule_jit(ups, {"a": 10, "b": 5}))
    # b shares R1 with a, so it starts when a frees the unit.
    assert events["b"].start_min == events["a"].end_min == 10


def test_start_after_constraint_with_delay():
    ups = [
        {"operations": [{"id": "a", "equipmentId": "R1"}]},
        {"operations": [
            {"id": "b", "equipmentId": "R2",
             "startAfterConstraints": [{"targetOperationId": "a", "delayMin": 10}]}
        ]},
    ]
    events = ev_by_id(schedule_jit(ups, {"a": 20, "b": 5}))
    # b starts at a.end (20) + 10 delay = 30
    assert events["b"].start_min == 30
    assert batch_time(list(events.values())) == 35
