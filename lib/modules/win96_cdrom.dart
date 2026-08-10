import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class Win96CdromModule extends StatefulWidget {
  const Win96CdromModule({super.key});

  @override
  State<Win96CdromModule> createState() => _Win96CdromModuleState();
}

class _Win96CdromModuleState extends State<Win96CdromModule> {
  String _discTitle = 'WOOD_OS_APPS_VOL1 (E:)';
  String _discStatus = 'CD-ROM lukuvalmiudessa (32x Speed).';
  bool _isReading = false;

  void _mountDisc(String title) {
    setState(() {
      _isReading = true;
      _discTitle = title;
      _discStatus = 'Luetaan levyä: $title...';
    });

    Future.delayed(const Duration(milliseconds: 800), () {
      if (mounted) {
        setState(() {
          _isReading = false;
          _discStatus = 'Levy "$title" kytketty asemaan E:\\ onnistuneesti.';
        });
      }
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
              '💿 Win96 Virtual CD-ROM AutoPlay',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              _discTitle,
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
            children: [
              const Icon(FluentIcons.cd_solid, size: 48, color: Colors.blue),
              const SizedBox(height: 12),
              Text(
                _discStatus,
                style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 12, fontFamily: 'monospace'),
              ),
              if (_isReading) ...[
                const SizedBox(height: 12),
                const ProgressBar(),
              ],
            ],
          ),
        ),
        const SizedBox(height: 16),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            Button(
              onPressed: _isReading ? null : () => _mountDisc('WOOD_OS_APPS_VOL1 (E:)'),
              child: const Text('Mount Apps CD'),
            ),
            Button(
              onPressed: _isReading ? null : () => _mountDisc('PINBALL_3D_DX (E:)'),
              child: const Text('Mount Pinball CD'),
            ),
            Button(
              onPressed: _isReading ? null : () => _mountDisc('CHILL_MIDI_SOUNDTRACK (E:)'),
              child: const Text('Mount Audio CD'),
            ),
          ],
        ),
      ],
    );
  }
}
