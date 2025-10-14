import win32evtlog

def read_event_log(server, logtype):
    """Odczytuje wszystkie zdarzenia z danego dziennika (np. System, Application)."""
    records = []
    hand = win32evtlog.OpenEventLog(server, logtype)
    total = win32evtlog.GetNumberOfEventLogRecords(hand)
    flags = win32evtlog.EVENTLOG_BACKWARDS_READ | win32evtlog.EVENTLOG_SEQUENTIAL_READ
    try:
        events = True
        while events:
            events = win32evtlog.ReadEventLog(hand, flags, 0)
            for e in events:
                try:
                    records.append({
                        'SourceName': e.SourceName,
                        'EventID': e.EventID & 0xFFFF,
                        'TimeGenerated': e.TimeGenerated.Format(),
                        'EventType': e.EventType,
                        'Category': e.EventCategory,
                        'ComputerName': e.ComputerName,
                        'Strings': e.StringInserts
                    })
                except Exception:
                    pass
    except Exception as ex:
        records.append({'error': str(ex)})
    return records


def get_events_info():
    """Zwraca logi z głównych dzienników Windows."""
    data = {}
    try:
        data['System'] = read_event_log(None, 'System')
        data['Application'] = read_event_log(None, 'Application')
        data['Security'] = read_event_log(None, 'Security')
    except Exception as e:
        data['error'] = str(e)
    return data
