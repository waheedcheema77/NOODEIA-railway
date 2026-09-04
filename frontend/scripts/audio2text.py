import os
import sys
import traceback
import groq

def transcribe_audio_file(audio_file_path):
    """Transcribe audio file using Groq Whisper API"""
    print(f"#####Transcribing audio file: {audio_file_path}", file=sys.stderr)

    groq_api_key = os.getenv('GROQ_API_KEY')
    if not groq_api_key:
        print("Error: GROQ_API_KEY environment variable is not set", file=sys.stderr)
        sys.exit(1)

    try:
        client = groq.Groq(api_key=groq_api_key)
        
        with open(audio_file_path, 'rb') as audio_file:
            transcription = client.audio.transcriptions.create(
                file=(os.path.basename(audio_file_path), audio_file.read()),
                model="whisper-large-v3",
                response_format="json",
                language="en",
                temperature=0.0
            )
            
        text = transcription.text.strip()
        return text
    except Exception as e:
        print(f"Error transcribing audio: {e!s}", file=sys.stderr)
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    # Usage: python audio2text.py input_audio_file
    print("Script started", file=sys.stderr)
    print(f"Arguments: {sys.argv}", file=sys.stderr)
    
    if len(sys.argv) < 2:
        print("Usage: python audio2text.py input_audio_file", file=sys.stderr)
        sys.exit(1)
    
    audio_file_path = sys.argv[1]
    print(f"Checking file: {audio_file_path}", file=sys.stderr)
    
    if not os.path.exists(audio_file_path):
        print(f"Error: File not found at {audio_file_path}", file=sys.stderr)
        sys.exit(1)
        
    print(f"File exists. Size: {os.path.getsize(audio_file_path)} bytes", file=sys.stderr)
    
    transcription_text = transcribe_audio_file(audio_file_path)
    
    if transcription_text:
        print("Transcription successful.", file=sys.stderr)
        # Print ONLY the text to stdout so it can be captured by the node.js script
        print(transcription_text)
    else:
        print("Error: Transcription returned empty result.", file=sys.stderr)
        sys.exit(1)
