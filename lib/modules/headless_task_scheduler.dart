import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class HeadlessTaskSchedulerModule extends StatefulWidget {
  const HeadlessTaskSchedulerModule({super.key});

  @override
  State<HeadlessTaskSchedulerModule> createState() => _HeadlessTaskSchedulerModuleState();
}

class _HeadlessTaskSchedulerModuleState extends State<HeadlessTaskSchedulerModule> {
  bool _schedulerActive = true;
  String _schedulerStatus = 'Cron-ajastin aktiivinen: Seuraava ajo 60 sekunnin kuluttua.';
  final List<Map<String, String>> _scheduledJobs = [
    {'job': 'VectorStoreGarbageCollector', 'schedule': '0 */2 * * *', 'status': 'Odottaa'},
    {'job': 'HeadlessTelemetryBackup', 'schedule': '*/15 * * * *', 'status': 'Aktiivinen'},
    {'job': 'NeuralWeightsOptimizer', 'schedule': '0 0 * * *', 'status': 'Odottaa'},
  ];

  void _runJobNow() {
    setState(() {
      _schedulerStatus = 'Ajastettu taustatehtävä suoritettu manuaalisesti onnistuneesti.';
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
              '⏰ Headless Task Scheduler & Cron Engine',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              _schedulerActive ? 'AJASTETTU' : 'PYSÄYTETTY',
              style: TextStyle(color: _schedulerActive ? Colors.blue.withOpacity(0.9) : Colors.red, fontSize: 11, fontFamily: 'monospace'),
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
            _schedulerStatus,
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
              itemCount: _scheduledJobs.length,
              itemBuilder: (context, index) {
                final job = _scheduledJobs[index];
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
                          Text(job['job']!, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                          Text('Cron: ${job['schedule']}', style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 10, fontFamily: 'monospace')),
                        ],
                      ),
                      Text(
                        job['status']!,
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
              onPressed: _runJobNow,
              child: const Text('Suorita cron-tehtävä nyt'),
            ),
            ToggleSwitch(
              checked: _schedulerActive,
              content: const Text('Ajastin aktiivinen', style: TextStyle(color: Colors.white, fontSize: 12)),
              onChanged: (val) {
                setState(() {
                  _schedulerActive = val;
                });
              },
            ),
          ],
        ),
      ],
    );
  }
}
