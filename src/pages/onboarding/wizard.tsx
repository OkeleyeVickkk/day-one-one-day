import { useState } from "react";
import { useNavigate } from "react-router";
import { ActionButton } from "../../components/base/action-button";
import { Input } from "../../components/ui/input";

const steps = [
	{ id: 1, title: "Why are you here?", description: "Tell us your reason for joining" },
	{ id: 2, title: "Profile Setup", description: "Tell us about yourself" },
	{ id: 3, title: "Connect Accounts", description: "Link your social media" },
	{ id: 4, title: "Tutorial", description: "Learn the basics" },
];

const platforms = [
	{ id: "twitter", name: "X/Twitter", icon: "🐦" },
	{ id: "facebook", name: "Facebook", icon: "📘" },
	{ id: "instagram", name: "Instagram", icon: "📷" },
	{ id: "linkedin", name: "LinkedIn", icon: "💼" },
	{ id: "tiktok", name: "TikTok", icon: "🎵" },
];

export default function OnboardingWizard() {
	const [currentStep, setCurrentStep] = useState(1);
	const [profile, setProfile] = useState({ username: "", bio: "", avatar: null as File | null });
	const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
	const [reason, setReason] = useState("");
	const navigate = useNavigate();

	const nextStep = () => {
		if (currentStep < steps.length) {
			setCurrentStep(currentStep + 1);
		} else {
			// Complete onboarding
			navigate("/dashboard");
		}
	};

	const prevStep = () => {
		if (currentStep > 1) {
			setCurrentStep(currentStep - 1);
		}
	};

	const skipOnboarding = () => {
		navigate("/dashboard");
	};

	const handlePlatformConnect = (platformId: string) => {
		setConnectedPlatforms((prev) => (prev.includes(platformId) ? prev.filter((id) => id !== platformId) : [...prev, platformId]));
	};

	const renderStepContent = () => {
		switch (currentStep) {
			case 1:
				return (
					<div className="space-y-6">
						<div className="text-center">
							<h2 className="text-2xl font-bold text-gray-900">Why are you joining 11 Day?</h2>
							<p className="mt-2 text-gray-600">Help us understand your motivation.</p>
						</div>
						<div className="space-y-4">
							<div>
								<label htmlFor="reason" className="block text-sm font-medium text-gray-700">
									Your Reason
								</label>
								<textarea
									id="reason"
									rows={4}
									value={reason}
									onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)}
									placeholder="Why do you want to record daily videos?"
									className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								/>
							</div>
						</div>
					</div>
				);
			case 2:
				return (
					<div className="space-y-6">
						<div className="text-center">
							<h2 className="text-2xl font-bold text-gray-900">Welcome to 11 Day!</h2>
							<p className="mt-2 text-gray-600">Let's set up your profile to get started.</p>
						</div>
						<div className="space-y-4">
							<div>
								<label htmlFor="username" className="block text-sm font-medium text-gray-700">
									Username
								</label>
								<Input
									type="text"
									id="username"
									value={profile.username}
									onChange={(e) => setProfile((prev) => ({ ...prev, username: e.target.value }))}
									placeholder="Your username"
									className="w-full"
								/>
							</div>
							<div>
								<label htmlFor="bio" className="block text-sm font-medium text-gray-700">
									Bio
								</label>
								<textarea
									id="bio"
									rows={3}
									value={profile.bio}
									onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setProfile((prev) => ({ ...prev, bio: e.target.value }))}
									placeholder="Tell us about yourself"
									className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700">Profile Picture</label>
								<input
									type="file"
									accept="image/*"
									onChange={(e) => {
										if (e.target.files && e.target.files[0]) {
											setProfile((prev) => ({ ...prev, avatar: e.target.files![0] }));
										}
									}}
									className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
								/>
							</div>
						</div>
					</div>
				);
			case 3:
				return (
					<div className="space-y-6">
						<div className="text-center">
							<h2 className="text-2xl font-bold text-gray-900">Connect Your Platforms</h2>
							<p className="mt-2 text-gray-600">Link your social media accounts to start posting.</p>
						</div>
						<div className="space-y-4">
							{platforms.map((platform) => (
								<div key={platform.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
									<div className="flex items-center">
										<span className="text-2xl mr-3">{platform.icon}</span>
										<span className="font-medium text-gray-900">{platform.name}</span>
									</div>
									<button
										onClick={() => handlePlatformConnect(platform.id)}
										className={`px-4 py-2 rounded-md text-sm font-medium ${
											connectedPlatforms.includes(platform.id) ? "bg-green-100 text-green-800" : "bg-blue-600 text-white hover:bg-blue-700"
										}`}>
										{connectedPlatforms.includes(platform.id) ? "Connected" : "Connect"}
									</button>
								</div>
							))}
						</div>
					</div>
				);
			case 4:
				return (
					<div className="space-y-6">
						<div className="text-center">
							<h2 className="text-2xl font-bold text-gray-900">Quick Tutorial</h2>
							<p className="mt-2 text-gray-600">Here's how to get the most out of 11 Day.</p>
						</div>
						<div className="space-y-4">
							<div className="bg-blue-50 p-4 rounded-lg">
								<h3 className="font-medium text-blue-900">1. Record Daily</h3>
								<p className="text-blue-700">Capture your 30-second video each day.</p>
							</div>
							<div className="bg-green-50 p-4 rounded-lg">
								<h3 className="font-medium text-green-900">2. Auto-Upload</h3>
								<p className="text-green-700">Videos are compressed and saved to your Google Drive.</p>
							</div>
							<div className="bg-purple-50 p-4 rounded-lg">
								<h3 className="font-medium text-purple-900">3. View History</h3>
								<p className="text-purple-700">Relive your memories anytime.</p>
							</div>
						</div>
					</div>
				);
			default:
				return null;
		}
	};

	return (
		<div className="min-h-screen bg-gray-50 flex items-center justify-center">
			<div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
				{/* Progress Bar */}
				<div className="mb-8">
					<div className="flex justify-between mb-2">
						{steps.map((step) => (
							<div key={step.id} className={`flex-1 text-center text-sm font-medium ${step.id <= currentStep ? "text-blue-600" : "text-gray-400"}`}>
								{step.title}
							</div>
						))}
					</div>
					<div className="w-full bg-gray-200 rounded-full h-2">
						<div
							className="bg-blue-600 h-2 rounded-full transition-all duration-300"
							style={{ width: `${(currentStep / steps.length) * 100}%` }}></div>
					</div>
				</div>

				{/* Step Content */}
				{renderStepContent()}

				{/* Navigation */}
				<div className="mt-8 flex justify-between">
					<ActionButton onClick={prevStep} disabled={currentStep === 1} variant="outline">
						Previous
					</ActionButton>
					<div className="flex space-x-2">
						<ActionButton onClick={skipOnboarding} variant="ghost">
							Skip
						</ActionButton>
						<ActionButton onClick={nextStep}>{currentStep === steps.length ? "Get Started" : "Next"}</ActionButton>
					</div>
				</div>
			</div>
		</div>
	);
}
