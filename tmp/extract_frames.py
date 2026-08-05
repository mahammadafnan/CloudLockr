import cv2
import os

video_path = r"C:\Users\maham\.gemini\antigravity\scratch\major_project\tmp\ref_video.mp4"
output_dir = r"C:\Users\maham\.gemini\antigravity\scratch\major_project\tmp"

cap = cv2.VideoCapture(video_path)
fps = cap.get(cv2.CAP_PROP_FPS)
print("FPS of video:", fps)

# We want frames at 0s, 0.5s, 1s, 1.5s, 2s, 3s, 4s, 5s
times = [0, 0.5, 1, 1.5, 2, 3, 4, 5]

for t in times:
    frame_no = int(t * fps)
    cap.set(cv2.CAP_PROP_POS_FRAMES, frame_no)
    ret, frame = cap.read()
    if ret:
        out_name = os.path.join(output_dir, f"frame_{t}.jpg")
        cv2.imwrite(out_name, frame)
        print(f"Saved frame at {t}s as {out_name}")
    else:
        print(f"Could not read frame at {t}s")

cap.release()
