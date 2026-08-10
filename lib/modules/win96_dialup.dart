import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class Win96DialupModule extends StatefulWidget {
  const Win96DialupModule({super.key});

  @override
  State<Win96DialupModule> createState() => _Win96DialupModuleState();
}

class _Win96DialupModuleState extends State<Win96DialupModule> {
  String _connectionStatus = 'Katkaistu (Not Connected)';
  bool _isConnecting = false;
  double _connectProgress = 0.0;

  void _connectModem() {
    setState(() {
      _isConnecting = true;
      _connectProgress = 25.0;
      _connectionStatus = 'Valitaan numeroa: 020202 (Wood-Booster ISP)...';
    });

    Future.delayed(const Duration(milliseconds: 500), () {
      if (mounted) {
        setState(() {
          _connectProgress = 60.0;
          _connectionStatus = 'Kättely (Handshaking 56,000 bps)...';
        });
      }
    });

    Future.delayed(const Duration(milliseconds: 1100), () {
      if (mounted) {
        setState(() {
          _connectProgress = 100.0;
          _isConnecting = false;
          _connectionStatus = 'Yhdistetty verkkoon! IP: 192.168.96.42';
        });
      }
    });
  }

  void _disconnectModem() {
    setState(() {
      _isConnecting = false;
      _connectProgress = 0.0;
      _connectionStatus = 'Katkaistu (Not Connected)';
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
              '☎️ Win96 Dial-Up Networking (56k Modem)',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              _isConnecting ? 'Yhdistetään...' : 'Puhelinlinja',
              style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 11, fontFamily: 'monospace'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.black,
            borderRadius: BorderRadius.circular(6),
            border: Border.all(color: Colors.white.withOpacity(0.2)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                _connectionStatus,
                style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 12, fontFamily: 'monospace'),
              ),
              const SizedBox(height: 16),
              ProgressBar(value: _isConnecting ? _connectProgress : (_connectProgress == 100.0 ? 100.0 : 0.0)),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            FilledButton(
              onPressed: _isConnecting ? null : _connectModem,
              child: const Text('Soita ja yhdistä (Dial)'),
            ),
            Button(
              onPressed: _disconnectModem,
              child: const Text('Katkaise yhteys'),
            ),
          ],
        ),
      ],
    );
  }
}
