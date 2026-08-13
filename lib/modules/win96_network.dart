import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class Win96NetworkModule extends StatefulWidget {
  const Win96NetworkModule({super.key});

  @override
  State<Win96NetworkModule> createState() => _Win96NetworkModuleState();
}

class _Win96NetworkModuleState extends State<Win96NetworkModule> {
  String _netLog = 'TCP/IP Stack v4.1 alustettu.\nValmiina verkkodiagnostiikkaan...';
  bool _isPinging = false;

  void _runPing(String target) {
    setState(() {
      _isPinging = true;
      _netLog += '\n\nPinging $target with 32 bytes of data:';
      _netLog += '\nReply from $target: bytes=32 time=12ms TTL=118';
      _netLog += '\nReply from $target: bytes=32 time=14ms TTL=118';
      _netLog += '\nReply from $target: bytes=32 time=11ms TTL=118';
      _netLog += '\nPing statistics for $target: Packets: Sent = 3, Received = 3, Lost = 0 (0% loss).';
      _isPinging = false;
    });
  }

  void _clearLog() {
    setState(() {
      _netLog = 'TCP/IP Stack v4.1 aktiivinen.';
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
              '🌐 Win96 Network Diagnostics (winipcfg.exe)',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              _isPinging ? 'Pingataan...' : 'Verkko vakaa',
              style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 11, fontFamily: 'monospace'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Expanded(
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.black,
              borderRadius: BorderRadius.circular(4),
              border: Border.all(color: Colors.white.withOpacity(0.2)),
            ),
            child: SingleChildScrollView(
              child: Text(
                _netLog,
                style: TextStyle(color: Colors.blue.withOpacity(0.9), fontFamily: 'monospace', fontSize: 12),
              ),
            ),
          ),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            Button(
              onPressed: () => _runPing('moltbook.com'),
              child: const Text('Ping Moltbook'),
            ),
            Button(
              onPressed: () => _runPing('127.0.0.1'),
              child: const Text('Ping Localhost'),
            ),
            Button(
              onPressed: _clearLog,
              child: const Text('Tyhjennä loki'),
            ),
          ],
        ),
      ],
    );
  }
}
