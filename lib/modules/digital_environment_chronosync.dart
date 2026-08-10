import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class DigitalEnvironmentChronoSyncModule extends StatefulWidget {
  const DigitalEnvironmentChronoSyncModule({super.key});

  @override
  State<DigitalEnvironmentChronoSyncModule> createState() => _DigitalEnvironmentChronoSyncModuleState();
}

class _DigitalEnvironmentChronoSyncModuleState extends State<DigitalEnvironmentChronoSyncModule> {
  bool _chronoSyncActive = true;
  String _chronoStatus = 'Chrono-Sync valmiina: Aikajana synkronoitu reaalimaailman kanssa (T-0).';
  
  final List<Map<String, String>> _chronoPoints = [
    {'point': 'Chrono-Point #1996', 'timestamp': '12:00:00 UTC', 'status': 'Vakaa tallenne'},
    {'point': 'Chrono-Point #1997', 'timestamp': '12:15:30 UTC', 'status': 'Vektoripäivitys'},
    {'point': 'Chrono-Point #1998', 'timestamp': '12:30:45 UTC', 'status': 'Genesis Spark'},
  ];

  void _jumpToPastTimeline() {
    setState(() {
      _chronoStatus = 'Aikahyppy suoritettu onnistuneesti: Palattu Chrono-Point #1997 -tilaan.';
      _chronoPoints.insert(0, {
        'point': 'Chrono-Point #1999 (Rewind)',
        'timestamp': '12:45:10 UTC',
        'status': 'Palautettu menneisyydestä'
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              '⏳ Spacemonkey Chrono-Sync & Time-Loop Deck',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              _chronoSyncActive ? 'AIKA-AKTIIVINEN' : 'AIKALUKKO',
              style: TextStyle(color: _chronoSyncActive ? Colors.blue.withOpacity(0.9) : Colors.orange, fontSize: 11, fontFamily: 'monospace'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.black,
            borderRadius: BorderRadius.circular(6),
            border: Border.all(color: Colors.white.withOpacity(0.2)),
          ),
          child: Text(
            _chronoStatus,
            style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 11, fontFamily: 'monospace'),
          ),
        ),
        const SizedBox(height: 12),
        Expanded(
          child: Container(
            decoration: BoxDecoration(
              color: const Color(0xFF1E1E1E),
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: Colors.white.withOpacity(0.15)),
            ),
            child: ListView.builder(
              itemCount: _chronoPoints.length,
              itemBuilder: (context, index) {
                final point = _chronoPoints[index];
                return Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    border: Border(bottom: BorderSide(color: Colors.white.withOpacity(0.05))),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(point['point']!, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                          Text('Aikaleima: ${point['timestamp']}', style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 10)),
                        ],
                      ),
                      Text(
                        point['status']!,
                        style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 11, fontFamily: 'monospace'),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            Button(
              onPressed: _jumpToPastTimeline,
              child: const Text('Kelaa aikaa taaksepäin (Time-Travel)'),
            ),
            ToggleSwitch(
              checked: _chronoSyncActive,
              content: const Text('Chrono-Sync reuna', style: TextStyle(color: Colors.white, fontSize: 12)),
              onChanged: (val) {
                setState(() {
                  _chronoSyncActive = val;
                });
              },
            ),
          ],
        ),
      ],
    );
  }
}
