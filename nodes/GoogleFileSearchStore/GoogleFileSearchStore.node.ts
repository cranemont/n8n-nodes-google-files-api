import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
	IDataObject,
} from 'n8n-workflow';

export class GoogleFileSearchStore implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Google File Search Store',
		name: 'googleFileSearchStore',
		icon: 'file:google-file-search.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Gemini File Search Store를 관리하고 RAG 기반 문서 검색을 수행합니다',
		defaults: {
			name: 'Google File Search Store',
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
						name: 'Create Store',
						value: 'createStore',
						action: 'Create a new file search store',
						description: '새 File Search Store를 생성합니다',
					},
					{
						name: 'List Stores',
						value: 'listStores',
						action: 'List all stores',
						description: '모든 File Search Store 목록을 조회합니다',
					},
					{
						name: 'Get Store',
						value: 'getStore',
						action: 'Get store details',
						description: 'Store 상세 정보를 조회합니다',
					},
					{
						name: 'Delete Store',
						value: 'deleteStore',
						action: 'Delete a store',
						description: 'Store를 삭제합니다',
					},
					{
						name: 'Upload Document',
						value: 'uploadDocument',
						action: 'Upload document to store',
						description: 'Store에 문서를 업로드하고 인덱싱합니다',
					},
					{
						name: 'Import File',
						value: 'importFile',
						action: 'Import file from Files API to store',
						description: '기존 Files API 파일을 Store에 가져옵니다',
					},
					{
						name: 'List Documents',
						value: 'listDocuments',
						action: 'List documents in store',
						description: 'Store 내 문서 목록을 조회합니다',
					},
					{
						name: 'Get Document',
						value: 'getDocument',
						action: 'Get document details',
						description: '특정 문서의 상세 정보를 조회합니다',
					},
					{
						name: 'Delete Document',
						value: 'deleteDocument',
						action: 'Delete document from store',
						description: 'Store에서 특정 문서를 삭제합니다',
					},
					{
						name: 'Query Documents',
						value: 'queryDocuments',
						action: 'Query documents in store',
						description: 'Store에서 시맨틱 검색을 수행합니다',
					},
					{
						name: 'Get Operation Status',
						value: 'getOperationStatus',
						action: 'Get operation status',
						description: '비동기 작업의 상태를 확인합니다',
					},
				],
				default: 'createStore',
			},
			// Create Store 파라미터
			{
				displayName: 'Display Name',
				name: 'storeDisplayName',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						operation: ['createStore'],
					},
				},
				description: 'Store의 표시 이름',
			},
			// Store 관련 공통 파라미터
			{
				displayName: 'Store Name',
				name: 'storeName',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						operation: ['getStore', 'deleteStore', 'uploadDocument', 'importFile', 'listDocuments', 'queryDocuments'],
					},
				},
				description: 'File Search Store 이름 (예: fileSearchStores/abc123)',
			},
			// Document Name 파라미터 (Get Document, Delete Document용)
			{
				displayName: 'Document Name',
				name: 'documentName',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						operation: ['getDocument', 'deleteDocument'],
					},
				},
				description: '문서 리소스 이름 (예: fileSearchStores/abc123/documents/doc456)',
			},
			// List Stores 파라미터
			{
				displayName: 'Page Size',
				name: 'pageSize',
				type: 'number',
				typeOptions: {
					minValue: 1,
					maxValue: 20,
				},
				default: 20,
				displayOptions: {
					show: {
						operation: ['listStores'],
					},
				},
				description: '한 페이지에 가져올 Store 수 (최대 20)',
			},
			{
				displayName: 'Page Token',
				name: 'pageToken',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['listStores'],
					},
				},
				description: '다음 페이지를 가져오기 위한 토큰',
			},
			// List Documents 파라미터
			{
				displayName: 'Page Size',
				name: 'documentPageSize',
				type: 'number',
				typeOptions: {
					minValue: 1,
					maxValue: 20,
				},
				default: 10,
				displayOptions: {
					show: {
						operation: ['listDocuments'],
					},
				},
				description: '한 페이지에 가져올 문서 수 (최대 20)',
			},
			{
				displayName: 'Page Token',
				name: 'documentPageToken',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['listDocuments'],
					},
				},
				description: '다음 페이지를 가져오기 위한 토큰',
			},
			// Delete Document 옵션
			{
				displayName: 'Force Delete',
				name: 'forceDelete',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						operation: ['deleteDocument'],
					},
				},
				description: 'true인 경우 연관된 Chunks도 함께 삭제합니다. false인 경우 Chunks가 존재하면 에러를 반환합니다.',
			},
			// Upload Document 파라미터
			{
				displayName: 'Binary Property',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				displayOptions: {
					show: {
						operation: ['uploadDocument'],
					},
				},
				description: '업로드할 바이너리 데이터가 있는 속성명',
			},
			{
				displayName: 'Document Display Name',
				name: 'documentDisplayName',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['uploadDocument'],
					},
				},
				description: '문서의 표시 이름 (비어있으면 파일명 사용)',
			},
			// Import File 파라미터
			{
				displayName: 'File Name',
				name: 'fileName',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						operation: ['importFile'],
					},
				},
				description: 'Files API에 업로드된 파일 이름 (예: files/abc123)',
			},
			// Chunking Options (Upload Document, Import File 공통)
			{
				displayName: 'Chunking Options',
				name: 'chunkingOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						operation: ['uploadDocument', 'importFile'],
					},
				},
				options: [
					{
						displayName: 'Max Tokens Per Chunk',
						name: 'maxTokensPerChunk',
						type: 'number',
						typeOptions: {
							minValue: 50,
							maxValue: 1000,
						},
						default: 200,
						description: '청크당 최대 토큰 수',
					},
					{
						displayName: 'Max Overlap Tokens',
						name: 'maxOverlapTokens',
						type: 'number',
						typeOptions: {
							minValue: 0,
							maxValue: 100,
						},
						default: 20,
						description: '청크 간 중복 토큰 수',
					},
				],
			},
			// Custom Metadata (Upload Document, Import File 공통)
			{
				displayName: 'Custom Metadata',
				name: 'customMetadata',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				default: {},
				displayOptions: {
					show: {
						operation: ['uploadDocument', 'importFile'],
					},
				},
				description: '문서에 추가할 메타데이터',
				options: [
					{
						name: 'metadataValues',
						displayName: 'Metadata',
						values: [
							{
								displayName: 'Key',
								name: 'key',
								type: 'string',
								default: '',
								description: '메타데이터 키',
							},
							{
								displayName: 'Value Type',
								name: 'valueType',
								type: 'options',
								options: [
									{ name: 'String', value: 'string' },
									{ name: 'Numeric', value: 'numeric' },
								],
								default: 'string',
								description: '값의 타입',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
								description: '메타데이터 값',
							},
						],
					},
				],
			},
			// Query Documents 파라미터
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				typeOptions: {
					rows: 3,
				},
				required: true,
				default: '',
				displayOptions: {
					show: {
						operation: ['queryDocuments'],
					},
				},
				description: '검색할 질문 또는 쿼리',
			},
			{
				displayName: 'Model',
				name: 'model',
				type: 'options',
				options: [
					{ name: 'Gemini 2.5 Flash', value: 'gemini-2.5-flash' },
					{ name: 'Gemini 2.5 Flash-Lite', value: 'gemini-2.5-flash-lite' },
					{ name: 'Gemini 2.5 Pro', value: 'gemini-2.5-pro' },
					{ name: 'Gemini 3 Pro Preview', value: 'gemini-3-pro-preview' },
					{ name: 'Gemini 3 Flash Preview', value: 'gemini-3-flash-preview' },
				],
				default: 'gemini-2.5-flash',
				displayOptions: {
					show: {
						operation: ['queryDocuments'],
					},
				},
				description: 'File Search에 사용할 Gemini 모델',
			},
			{
				displayName: 'Metadata Filter',
				name: 'metadataFilter',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['queryDocuments'],
					},
				},
				description: '메타데이터 필터 (예: author = "홍길동")',
			},
			// Get Operation Status 파라미터
			{
				displayName: 'Operation Name',
				name: 'operationName',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						operation: ['getOperationStatus'],
					},
				},
				description: 'Upload 응답에서 받은 작업 이름 (예: fileSearchStores/abc/operations/xyz 또는 fileSearchStores/abc/upload/operations/xyz)',
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

		const handleApiError = (error: unknown): Error => {
			const err = error as {
				response?: { status?: number; data?: { error?: { message?: string } } };
				message?: string;
				httpCode?: number;
				cause?: { code?: string; message?: string; response?: { body?: string | { error?: { message?: string } } } };
				description?: string;
			};

			// n8n httpRequest 헬퍼의 오류 형식 처리
			let statusCode: number | undefined;
			let apiMessage = 'Unknown API error';

			// 다양한 오류 형식에서 메시지 추출
			if (err.cause?.response?.body) {
				const body = err.cause.response.body;
				if (typeof body === 'string') {
					try {
						const parsed = JSON.parse(body);
						apiMessage = parsed.error?.message || apiMessage;
					} catch {
						apiMessage = body;
					}
				} else if (body.error?.message) {
					apiMessage = body.error.message;
				}
			} else if (err.description) {
				apiMessage = err.description;
			} else if (err.response?.data?.error?.message) {
				apiMessage = err.response.data.error.message;
			} else if (err.message) {
				apiMessage = err.message;
			}

			// 상태 코드 추출
			statusCode = err.httpCode || err.response?.status;

			if (statusCode === 400) {
				return new NodeOperationError(this.getNode(), `Bad request: ${apiMessage}`);
			} else if (statusCode === 403) {
				return new NodeOperationError(this.getNode(), `API Key가 유효하지 않거나 권한이 없습니다: ${apiMessage}`);
			} else if (statusCode === 404) {
				return new NodeOperationError(this.getNode(), `리소스를 찾을 수 없습니다: ${apiMessage}`);
			} else if (statusCode === 429) {
				return new NodeOperationError(this.getNode(), `API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요: ${apiMessage}`);
			}

			return new NodeOperationError(this.getNode(), apiMessage);
		};

		// Helper function to build custom metadata array for API
		const buildCustomMetadataArray = (customMetadata: IDataObject): Array<{ key: string; stringValue?: string; numericValue?: number }> => {
			const metadataArray: Array<{ key: string; stringValue?: string; numericValue?: number }> = [];
			if (customMetadata.metadataValues) {
				const metadataEntries = customMetadata.metadataValues as Array<{
					key: string;
					valueType: string;
					value: string;
				}>;
				for (const entry of metadataEntries) {
					if (entry.key) {
						if (entry.valueType === 'numeric') {
							metadataArray.push({ key: entry.key, numericValue: parseFloat(entry.value) });
						} else {
							metadataArray.push({ key: entry.key, stringValue: entry.value });
						}
					}
				}
			}
			return metadataArray;
		};

		// Helper function to build chunking config (snake_case for REST API)
		const buildChunkingConfigSnakeCase = (chunkingOptions: IDataObject): IDataObject | null => {
			const white_space_config: IDataObject = {};
			if (chunkingOptions.maxTokensPerChunk) {
				white_space_config.max_tokens_per_chunk = chunkingOptions.maxTokensPerChunk;
			}
			if (chunkingOptions.maxOverlapTokens) {
				white_space_config.max_overlap_tokens = chunkingOptions.maxOverlapTokens;
			}
			if (Object.keys(white_space_config).length > 0) {
				return { white_space_config };
			}
			return null;
		};

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData: IDataObject;

				if (operation === 'createStore') {
					// Create Store operation
					const displayName = this.getNodeParameter('storeDisplayName', i) as string;

					try {
						responseData = await this.helpers.httpRequest({
							method: 'POST',
							url: `${baseUrl}/v1beta/fileSearchStores`,
							qs: { key: apiKey },
							headers: {
								'Content-Type': 'application/json',
							},
							body: {
								display_name: displayName,
							},
							json: true,
						}) as IDataObject;
					} catch (error) {
						throw handleApiError(error);
					}
				} else if (operation === 'listStores') {
					// List Stores operation
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
							url: `${baseUrl}/v1beta/fileSearchStores`,
							qs,
							json: true,
						}) as IDataObject;
					} catch (error) {
						throw handleApiError(error);
					}
				} else if (operation === 'getStore') {
					// Get Store operation
					const storeName = this.getNodeParameter('storeName', i) as string;
					const normalizedStoreName = storeName.startsWith('fileSearchStores/')
						? storeName
						: `fileSearchStores/${storeName}`;

					try {
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/v1beta/${normalizedStoreName}`,
							qs: { key: apiKey },
							json: true,
						}) as IDataObject;
					} catch (error) {
						throw handleApiError(error);
					}
				} else if (operation === 'deleteStore') {
					// Delete Store operation
					const storeName = this.getNodeParameter('storeName', i) as string;
					const normalizedStoreName = storeName.startsWith('fileSearchStores/')
						? storeName
						: `fileSearchStores/${storeName}`;

					try {
						await this.helpers.httpRequest({
							method: 'DELETE',
							url: `${baseUrl}/v1beta/${normalizedStoreName}`,
							qs: { key: apiKey },
							json: true,
						});
						responseData = { success: true, deletedStore: normalizedStoreName };
					} catch (error) {
						throw handleApiError(error);
					}
				} else if (operation === 'uploadDocument') {
					// Upload Document operation
					const storeName = this.getNodeParameter('storeName', i) as string;
					const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
					const documentDisplayName = this.getNodeParameter('documentDisplayName', i) as string;
					const chunkingOptions = this.getNodeParameter('chunkingOptions', i) as IDataObject;
					const customMetadata = this.getNodeParameter('customMetadata', i) as IDataObject;

					const normalizedStoreName = storeName.startsWith('fileSearchStores/')
						? storeName
						: `fileSearchStores/${storeName}`;

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
					const fileName = documentDisplayName || binaryData.fileName || 'unnamed_document';

					// Build metadata for multipart upload
					const metadata: IDataObject = {};
					if (customMetadata.metadataValues) {
						const metadataEntries = customMetadata.metadataValues as Array<{
							key: string;
							valueType: string;
							value: string;
						}>;
						for (const entry of metadataEntries) {
							if (entry.key) {
								if (entry.valueType === 'numeric') {
									metadata[entry.key] = { numericValue: parseFloat(entry.value) };
								} else {
									metadata[entry.key] = { stringValue: entry.value };
								}
							}
						}
					}

					// Build chunking config (snake_case for REST API multipart upload)
					const chunkingConfigSnake = buildChunkingConfigSnakeCase(chunkingOptions);

					const boundary = '---n8n-boundary-' + Date.now().toString(16);

					// Build upload config with snake_case for REST API
					const uploadConfig: IDataObject = {
						display_name: fileName,
					};
					if (Object.keys(metadata).length > 0) {
						// Convert metadata to snake_case format
						const customMetadataSnake: IDataObject = {};
						for (const [key, value] of Object.entries(metadata)) {
							const metaValue = value as { stringValue?: string; numericValue?: number };
							if (metaValue.stringValue !== undefined) {
								customMetadataSnake[key] = { string_value: metaValue.stringValue };
							} else if (metaValue.numericValue !== undefined) {
								customMetadataSnake[key] = { numeric_value: metaValue.numericValue };
							}
						}
						uploadConfig.custom_metadata = customMetadataSnake;
					}
					if (chunkingConfigSnake) {
						uploadConfig.chunking_config = chunkingConfigSnake;
					}

					const metadataPart = JSON.stringify(uploadConfig);

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
							url: `${baseUrl}/upload/v1beta/${normalizedStoreName}:uploadToFileSearchStore`,
							qs: { key: apiKey },
							headers: {
								'X-Goog-Upload-Protocol': 'multipart',
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
				} else if (operation === 'importFile') {
					// Import File operation - Import existing Files API file to Store
					const storeName = this.getNodeParameter('storeName', i) as string;
					const fileName = this.getNodeParameter('fileName', i) as string;
					const chunkingOptions = this.getNodeParameter('chunkingOptions', i) as IDataObject;
					const customMetadata = this.getNodeParameter('customMetadata', i) as IDataObject;

					const normalizedStoreName = storeName.startsWith('fileSearchStores/')
						? storeName
						: `fileSearchStores/${storeName}`;

					const normalizedFileName = fileName.startsWith('files/')
						? fileName
						: `files/${fileName}`;

					// Build request body
					const requestBody: IDataObject = {
						file_name: normalizedFileName,
					};

					// Add custom metadata if provided
					const metadataArray = buildCustomMetadataArray(customMetadata);
					if (metadataArray.length > 0) {
						requestBody.custom_metadata = metadataArray;
					}

					// Add chunking config if provided (snake_case for REST API)
					const chunkingConfigSnake = buildChunkingConfigSnakeCase(chunkingOptions);
					if (chunkingConfigSnake) {
						requestBody.chunking_config = chunkingConfigSnake;
					}

					try {
						responseData = await this.helpers.httpRequest({
							method: 'POST',
							url: `${baseUrl}/v1beta/${normalizedStoreName}:importFile`,
							qs: { key: apiKey },
							headers: {
								'Content-Type': 'application/json',
							},
							body: requestBody,
							json: true,
						}) as IDataObject;
					} catch (error) {
						throw handleApiError(error);
					}
				} else if (operation === 'listDocuments') {
					// List Documents operation
					const storeName = this.getNodeParameter('storeName', i) as string;
					const pageSize = this.getNodeParameter('documentPageSize', i) as number;
					const pageToken = this.getNodeParameter('documentPageToken', i) as string;

					const normalizedStoreName = storeName.startsWith('fileSearchStores/')
						? storeName
						: `fileSearchStores/${storeName}`;

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
							url: `${baseUrl}/v1beta/${normalizedStoreName}/documents`,
							qs,
							json: true,
						}) as IDataObject;
					} catch (error) {
						throw handleApiError(error);
					}
				} else if (operation === 'getDocument') {
					// Get Document operation
					const documentName = this.getNodeParameter('documentName', i) as string;
					const normalizedDocumentName = documentName.startsWith('fileSearchStores/')
						? documentName
						: `fileSearchStores/${documentName}`;

					try {
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/v1beta/${normalizedDocumentName}`,
							qs: { key: apiKey },
							json: true,
						}) as IDataObject;
					} catch (error) {
						throw handleApiError(error);
					}
				} else if (operation === 'deleteDocument') {
					// Delete Document operation
					const documentName = this.getNodeParameter('documentName', i) as string;
					const forceDelete = this.getNodeParameter('forceDelete', i) as boolean;

					const normalizedDocumentName = documentName.startsWith('fileSearchStores/')
						? documentName
						: `fileSearchStores/${documentName}`;

					const qs: IDataObject = { key: apiKey };
					if (forceDelete) {
						qs.force = true;
					}

					try {
						await this.helpers.httpRequest({
							method: 'DELETE',
							url: `${baseUrl}/v1beta/${normalizedDocumentName}`,
							qs,
							json: true,
						});
						responseData = { success: true, deletedDocument: normalizedDocumentName };
					} catch (error) {
						throw handleApiError(error);
					}
				} else if (operation === 'queryDocuments') {
					// Query Documents operation - generateContent API with file_search tool
					const storeName = this.getNodeParameter('storeName', i) as string;
					const query = this.getNodeParameter('query', i) as string;
					const model = this.getNodeParameter('model', i) as string;
					const metadataFilter = this.getNodeParameter('metadataFilter', i) as string;

					const normalizedStoreName = storeName.startsWith('fileSearchStores/')
						? storeName
						: `fileSearchStores/${storeName}`;

					// Build file_search tool configuration
					const fileSearchConfig: IDataObject = {
						file_search_store_names: [normalizedStoreName],
					};

					if (metadataFilter) {
						fileSearchConfig.metadata_filter = metadataFilter;
					}

					const requestBody: IDataObject = {
						contents: [
							{
								parts: [{ text: query }],
							},
						],
						tools: [
							{
								file_search: fileSearchConfig,
							},
						],
					};

					try {
						const rawResponse = await this.helpers.httpRequest({
							method: 'POST',
							url: `${baseUrl}/v1beta/models/${model}:generateContent`,
							qs: { key: apiKey },
							headers: {
								'Content-Type': 'application/json',
							},
							body: requestBody,
							json: true,
						}) as IDataObject;

						// Parse response to extract answer and sources
						const candidates = rawResponse.candidates as Array<{
							content?: { parts?: Array<{ text?: string }> };
							groundingMetadata?: {
								groundingChunks?: Array<{
									retrievedContext?: {
										title?: string;
										text?: string;
										fileSearchStore?: string;
									};
								}>;
								groundingSupports?: Array<{
									segment?: { startIndex?: number; endIndex?: number; text?: string };
									groundingChunkIndices?: number[];
									confidenceScores?: number[];
								}>;
								retrievalMetadata?: IDataObject;
							};
						}>;

						// Extract answer text
						let answer = '';
						if (candidates?.[0]?.content?.parts) {
							answer = candidates[0].content.parts
								.map((part) => part.text || '')
								.join('');
						}

						// Extract sources from groundingMetadata
						const sources: Array<{
							document: string;
							store: string;
							chunk: string;
						}> = [];

						const groundingMetadata = candidates?.[0]?.groundingMetadata;
						if (groundingMetadata?.groundingChunks) {
							for (const chunk of groundingMetadata.groundingChunks) {
								if (chunk.retrievedContext) {
									sources.push({
										document: chunk.retrievedContext.title || 'Unknown',
										store: chunk.retrievedContext.fileSearchStore || '',
										chunk: chunk.retrievedContext.text || '',
									});
								}
							}
						}

						responseData = {
							answer,
							sources,
							groundingMetadata: groundingMetadata || null,
							rawResponse,
						};
					} catch (error) {
						throw handleApiError(error);
					}
				} else if (operation === 'getOperationStatus') {
					// Get Operation Status
					// Operation name은 Upload 응답에서 받은 전체 경로를 사용
					// 예: fileSearchStores/abc/operations/xyz 또는 fileSearchStores/abc/upload/operations/xyz
					const operationName = this.getNodeParameter('operationName', i) as string;

					try {
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/v1beta/${operationName}`,
							qs: { key: apiKey },
							json: true,
						}) as IDataObject;
					} catch (error) {
						throw handleApiError(error);
					}
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
