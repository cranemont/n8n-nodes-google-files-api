import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
	IDataObject,
} from 'n8n-workflow';

export class GoogleFileApi implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Google File API',
		name: 'googleFileApi',
		icon: 'file:google-file-api.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Google Gemini File API를 통해 파일을 업로드하고 관리합니다',
		defaults: {
			name: 'Google File API',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'googleGeminiApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Upload',
						value: 'upload',
						action: 'Upload a file',
						description: '파일을 Google File API에 업로드합니다',
					},
					{
						name: 'List',
						value: 'list',
						action: 'List all files',
						description: '업로드된 파일 목록을 조회합니다',
					},
					{
						name: 'Get',
						value: 'get',
						action: 'Get file details',
						description: '파일 상세 정보를 조회합니다',
					},
					{
						name: 'Delete',
						value: 'delete',
						action: 'Delete a file',
						description: '파일을 삭제합니다',
					},
					{
						name: 'Wait for Processing',
						value: 'waitForProcessing',
						action: 'Wait for file processing',
						description: '파일 처리가 완료될 때까지 대기합니다',
					},
				],
				default: 'upload',
			},
			// Upload 파라미터
			{
				displayName: 'Binary Property',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				displayOptions: {
					show: {
						operation: ['upload'],
					},
				},
				description: '업로드할 바이너리 데이터가 있는 속성명',
			},
			{
				displayName: 'Display Name',
				name: 'displayName',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['upload'],
					},
				},
				description: '파일의 표시 이름 (최대 512자). 비어있으면 원본 파일명 사용.',
			},
			// List 파라미터
			{
				displayName: 'Page Size',
				name: 'pageSize',
				type: 'number',
				typeOptions: {
					minValue: 1,
					maxValue: 100,
				},
				default: 100,
				displayOptions: {
					show: {
						operation: ['list'],
					},
				},
				description: '한 페이지에 가져올 파일 수',
			},
			{
				displayName: 'Page Token',
				name: 'pageToken',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['list'],
					},
				},
				description: '다음 페이지를 가져오기 위한 토큰',
			},
			// Get/Delete/Wait for Processing 파라미터
			{
				displayName: 'File ID',
				name: 'fileId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						operation: ['get', 'delete', 'waitForProcessing'],
					},
				},
				description: '파일 ID (예: files/abc123)',
			},
			// Wait for Processing 파라미터
			{
				displayName: 'Timeout (Seconds)',
				name: 'timeout',
				type: 'number',
				typeOptions: {
					minValue: 10,
					maxValue: 3600,
				},
				default: 300,
				displayOptions: {
					show: {
						operation: ['waitForProcessing'],
					},
				},
				description: '처리 완료 대기 최대 시간 (초)',
			},
			{
				displayName: 'Poll Interval (Seconds)',
				name: 'pollInterval',
				type: 'number',
				typeOptions: {
					minValue: 1,
					maxValue: 60,
				},
				default: 5,
				displayOptions: {
					show: {
						operation: ['waitForProcessing'],
					},
				},
				description: '상태 확인 간격 (초)',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0) as string;
		const credentials = await this.getCredentials('googleGeminiApi');
		const apiKey = credentials.apiKey as string;
		const baseUrl = 'https://generativelanguage.googleapis.com';

		const sleep = (ms: number): Promise<void> => {
			return new Promise((resolve) => setTimeout(resolve, ms));
		};

		const handleApiError = (error: unknown): Error => {
			const err = error as { response?: { status?: number; data?: { error?: { message?: string } } }; message?: string };

			if (err.response) {
				const statusCode = err.response.status;
				const apiMessage = err.response.data?.error?.message || 'Unknown API error';

				if (statusCode === 400) {
					return new NodeOperationError(this.getNode(), `Bad request: ${apiMessage}`);
				} else if (statusCode === 403) {
					return new NodeOperationError(this.getNode(), 'API Key가 유효하지 않거나 권한이 없습니다');
				} else if (statusCode === 404) {
					return new NodeOperationError(this.getNode(), '파일을 찾을 수 없습니다');
				} else if (statusCode === 429) {
					return new NodeOperationError(this.getNode(), 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요');
				}

				return new NodeOperationError(this.getNode(), apiMessage);
			}

			return new NodeOperationError(this.getNode(), err.message || 'Unknown error occurred');
		};

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData: IDataObject;

				if (operation === 'upload') {
					// Upload operation
					const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
					const displayName = this.getNodeParameter('displayName', i) as string;

					const binaryData = items[i].binary?.[binaryPropertyName];
					if (!binaryData) {
						throw new NodeOperationError(
							this.getNode(),
							`No binary data found for property "${binaryPropertyName}"`,
							{ itemIndex: i },
						);
					}

					const buffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);
					const mimeType = binaryData.mimeType || 'application/octet-stream';
					const fileName = displayName || binaryData.fileName || 'unnamed_file';

					// Use resumable upload for files > 20MB
					if (buffer.length > 20 * 1024 * 1024) {
						// Resumable upload
						const initResponse = await this.helpers.httpRequest({
							method: 'POST',
							url: `${baseUrl}/upload/v1beta/files?key=${apiKey}`,
							headers: {
								'X-Goog-Upload-Protocol': 'resumable',
								'X-Goog-Upload-Command': 'start',
								'X-Goog-Upload-Header-Content-Length': buffer.length.toString(),
								'X-Goog-Upload-Header-Content-Type': mimeType,
								'Content-Type': 'application/json',
							},
							body: JSON.stringify({
								file: { display_name: fileName },
							}),
							returnFullResponse: true,
						});

						const uploadUrl = initResponse.headers['x-goog-upload-url'] as string;
						if (!uploadUrl) {
							throw new NodeOperationError(
								this.getNode(),
								'Failed to get resumable upload URL from response',
							);
						}

						const uploadResponse = await this.helpers.httpRequest({
							method: 'POST',
							url: uploadUrl,
							headers: {
								'X-Goog-Upload-Offset': '0',
								'X-Goog-Upload-Command': 'upload, finalize',
								'Content-Type': mimeType,
							},
							body: buffer,
							json: true,
						});

						responseData = uploadResponse.file as IDataObject;
					} else {
						// Simple multipart upload
						const boundary = '---n8n-boundary-' + Date.now().toString(16);
						const metadataPart = JSON.stringify({ file: { display_name: fileName } });

						const bodyParts: Buffer[] = [
							Buffer.from(`--${boundary}\r\n`),
							Buffer.from('Content-Type: application/json; charset=UTF-8\r\n\r\n'),
							Buffer.from(metadataPart + '\r\n'),
							Buffer.from(`--${boundary}\r\n`),
							Buffer.from(`Content-Type: ${mimeType}\r\n\r\n`),
							buffer,
							Buffer.from(`\r\n--${boundary}--\r\n`),
						];

						const body = Buffer.concat(bodyParts);

						try {
							const response = await this.helpers.httpRequest({
								method: 'POST',
								url: `${baseUrl}/upload/v1beta/files?key=${apiKey}`,
								headers: {
									'Content-Type': `multipart/related; boundary=${boundary}`,
									'Content-Length': body.length.toString(),
								},
								body,
								json: false,
							});

							responseData = typeof response === 'string' ? JSON.parse(response) : response;
						} catch (error) {
							throw handleApiError(error);
						}
					}
				} else if (operation === 'list') {
					// List operation
					const pageSize = this.getNodeParameter('pageSize', i) as number;
					const pageToken = this.getNodeParameter('pageToken', i) as string;

					const qs: IDataObject = {
						key: apiKey,
						pageSize,
					};
					if (pageToken) {
						qs.pageToken = pageToken;
					}

					try {
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/v1beta/files`,
							qs,
							json: true,
						}) as IDataObject;
					} catch (error) {
						throw handleApiError(error);
					}
				} else if (operation === 'get') {
					// Get operation
					const fileId = this.getNodeParameter('fileId', i) as string;
					const normalizedFileId = fileId.startsWith('files/') ? fileId : `files/${fileId}`;

					try {
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/v1beta/${normalizedFileId}`,
							qs: { key: apiKey },
							json: true,
						}) as IDataObject;
					} catch (error) {
						throw handleApiError(error);
					}
				} else if (operation === 'delete') {
					// Delete operation
					const fileId = this.getNodeParameter('fileId', i) as string;
					const normalizedFileId = fileId.startsWith('files/') ? fileId : `files/${fileId}`;

					try {
						await this.helpers.httpRequest({
							method: 'DELETE',
							url: `${baseUrl}/v1beta/${normalizedFileId}`,
							qs: { key: apiKey },
							json: true,
						});
						responseData = { success: true, deletedFile: normalizedFileId };
					} catch (error) {
						throw handleApiError(error);
					}
				} else if (operation === 'waitForProcessing') {
					// Wait for Processing operation
					const fileId = this.getNodeParameter('fileId', i) as string;
					const timeout = this.getNodeParameter('timeout', i) as number;
					const pollInterval = this.getNodeParameter('pollInterval', i) as number;
					const normalizedFileId = fileId.startsWith('files/') ? fileId : `files/${fileId}`;

					const startTime = Date.now();
					const timeoutMs = timeout * 1000;
					const pollIntervalMs = pollInterval * 1000;

					let processingComplete = false;
					while (Date.now() - startTime < timeoutMs && !processingComplete) {
						try {
							const response = await this.helpers.httpRequest({
								method: 'GET',
								url: `${baseUrl}/v1beta/${normalizedFileId}`,
								qs: { key: apiKey },
								json: true,
							}) as IDataObject;

							const state = response.state as string;

							if (state === 'ACTIVE') {
								responseData = response;
								processingComplete = true;
							} else if (state === 'FAILED') {
								throw new NodeOperationError(
									this.getNode(),
									`File processing failed: ${normalizedFileId}. Error: ${response.error || 'Unknown error'}`,
									{ itemIndex: i },
								);
							} else {
								// State is PROCESSING, wait and retry
								await sleep(pollIntervalMs);
							}
						} catch (error) {
							if ((error as NodeOperationError).message?.includes('processing failed')) {
								throw error;
							}
							throw handleApiError(error);
						}
					}

					if (!processingComplete) {
						throw new NodeOperationError(
							this.getNode(),
							`Timeout waiting for file processing: ${normalizedFileId}. Maximum wait time of ${timeout} seconds exceeded.`,
							{ itemIndex: i },
						);
					}

					responseData = responseData!;
				} else {
					throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
				}

				returnData.push({
					json: responseData,
					pairedItem: { item: i },
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
