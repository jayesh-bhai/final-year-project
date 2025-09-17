import kagglehub

# Download latest version
path = kagglehub.dataset_download("bertvankeulen/cicids-2017")

print("Path to dataset files:", path)