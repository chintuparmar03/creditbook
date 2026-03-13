"""
Custom CORS middleware – adds CORS headers to every response.
This is a failsafe in case django-cors-headers doesn't work in production.
"""


class CORSMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Handle preflight OPTIONS request
        if request.method == 'OPTIONS':
            response = self._build_preflight_response()
        else:
            response = self.get_response(request)
            self._add_cors_headers(response)
        return response

    def _build_preflight_response(self):
        from django.http import HttpResponse
        response = HttpResponse(status=200)
        self._add_cors_headers(response)
        return response

    def _add_cors_headers(self, response):
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Accept, Accept-Encoding, Authorization, Content-Type, DNT, Origin, User-Agent, X-CSRFToken, X-Requested-With'
        response['Access-Control-Allow-Credentials'] = 'true'
        response['Access-Control-Max-Age'] = '86400'
